"""
Gemini Live メッセージ受信処理のヘルパー関数。
"""

from __future__ import annotations

import asyncio
import inspect
import logging
import time
from collections.abc import AsyncIterator

from app.services.gemini_live.config import GeminiLiveConfig
from app.services.gemini_live.helpers import (
    chat_debug_enabled,
    deep_find_keys,
    extract_blob_bytes,
    extract_mime,
)
from app.services.gemini_live.tools import (
    tool_call_function_calls,
    tool_call_to_frontend_command,
)
from app.services.gemini_live.tools.color_mix import MODES, mix, parse_hex, to_hex
from app.services.gemini_live.tools.color_shift import DEFAULT_AMOUNT, shift_toward
from app.services.gemini_live.tools.educational import build_show_content_response
from app.services.gemini_live.transcription import (
    extract_finished_from_transcription_obj,
    extract_text_from_transcription_obj,
    merge_streaming_text,
)
from app.services.gemini_live_types import (
    LiveAssistantTextEvent,
    LiveAudioChunk,
    LiveCommandEvent,
    LiveInterruptedEvent,
    LiveSuggestionPendingEvent,
    LiveTranscriptEvent,
)
from app.services.navigation import NavState
from app.services.navigation.action_graph import (
    PRIORITY_RUN_SUGGESTION,
    PRIORITY_SHOW_CONTENT,
    load_action_graph,
    ui_state_of,
)

logger = logging.getLogger("uvicorn.error")

# Added to the tool response of an action after which a suggestion is held: without it the model
# tends to end its report with a suggestion of its own, right before the held one arrives.
ACTION_NEXT_STEP = (
    "Report the result in one short sentence, then stop. Do NOT add any suggestion or question "
    "of your own."
)


def _hold_after_action(nav_state: NavState, name: str, args: dict, ui: dict, language: str) -> bool:
    """操作の tool call の後に勧める候補を保留する。保留したら True。

    1ターンに複数の操作があるときは、優先度の最も高い操作を「直前の操作」とする。
    """
    ctx = load_action_graph().context_for_call(name, args)
    if ctx is None or ctx[1] <= nav_state.turn_priority:
        return False
    node_id, nav_state.turn_priority = ctx
    nav_state.hold_suggestions(nav_state.next_suggestions(node_id, language, ui))
    logger.info(
        "SUGGEST: after %s → %s held=%s",
        name,
        node_id,
        [s["id"] for s in nav_state.pending_suggestions],
    )
    return bool(nav_state.pending_suggestions)


async def _mix_colors(args: dict, event_q: asyncio.Queue, color_service, language: str) -> dict:
    """MIX_COLORS: 混色をコードで計算し、結果の色を選択して、元の色と結果を3D空間にラベル表示する。"""
    items = [c for c in (args.get("colors") or []) if isinstance(c, dict)]
    parsed = [(str(c.get("name") or "").strip(), parse_hex(c.get("hex"))) for c in items]
    parsed = [(n, rgb) for n, rgb in parsed if rgb is not None][:4]
    if len(parsed) < 2:
        return {"result": "error", "error": "Give at least two colors, each with a #RRGGBB hex."}
    mode = args.get("mode") if args.get("mode") in MODES else "light"
    r, g, b = mix([rgb for _, rgb in parsed], mode)
    mixed_label = ("混色" if language == "ja" else "Mix") + f" {to_hex((r, g, b))}"
    labels = [{"r": c[0], "g": c[1], "b": c[2], "label": n or to_hex(c)} for n, c in parsed]
    labels.append({"r": r, "g": g, "b": b, "label": mixed_label})
    for name, params in (
        ("SELECT_COLOR", {"r": r, "g": g, "b": b, "target": "focused"}),
        ("SHOW_COLOR_LABELS", {"colors": labels}),
    ):
        cmd = tool_call_to_frontend_command(name, params)
        await event_q.put(LiveCommandEvent(command=cmd, tool_name=name, tool_call_id=None))
    resp: dict = {"result": "ok", "mode": mode, "hex": to_hex((r, g, b))}
    resp = _with_closest_name(resp, (r, g, b), color_service, language)
    logger.info("MIX_COLORS: %s %s -> %s", mode, [to_hex(c) for _, c in parsed], resp)
    return resp


def _with_closest_name(resp: dict, rgb: tuple[int, int, int], color_service, language: str) -> dict:
    if color_service is not None:
        closest = color_service.find_closest_colors(*rgb, top_n=1, language=language)
        if closest:
            resp["name"] = closest[0]["name"]
            resp["name_tags"] = closest[0]["tags"]
    return resp


def _color_set_by(name: str, params: object) -> tuple[int, int, int] | None:
    """SELECT_COLOR / SET_HEX / SET_BACKGROUND_COLOR が設定する色。それ以外は None。"""
    if not isinstance(params, dict):
        return None
    if name == "SELECT_COLOR" and isinstance(params.get("color"), dict):
        c = params["color"]
        return int(c.get("r", 0)), int(c.get("g", 0)), int(c.get("b", 0))
    if name in ("SET_HEX", "SET_BACKGROUND_COLOR"):
        return parse_hex(params.get("hex"))
    return None


async def _shift_toward(args: dict, event_q: asyncio.Queue, ui: dict, color_service, language: str) -> dict:
    """SHIFT_TOWARD_COLOR: 選択色または背景色を、指定の色へ OKLab で近づけて適用する。"""
    goal = parse_hex(args.get("hex"))
    target = "background" if args.get("target") == "background" else "focused"
    current = parse_hex(ui.get("background") if target == "background" else ui.get("hex"))
    if goal is None or current is None:
        return {"result": "error", "error": "Give the color to move toward as a #RRGGBB hex."}
    try:
        amount = float(args.get("amount", DEFAULT_AMOUNT))
    except (TypeError, ValueError):
        amount = DEFAULT_AMOUNT
    rgb = shift_toward(current, goal, amount)
    if target == "background":
        name, params = "SET_BACKGROUND_COLOR", {"hex": to_hex(rgb)}
    else:
        name, params = "SELECT_COLOR", {"r": rgb[0], "g": rgb[1], "b": rgb[2], "target": "focused"}
    cmd = tool_call_to_frontend_command(name, params)
    await event_q.put(LiveCommandEvent(command=cmd, tool_name=name, tool_call_id=None))
    resp = {"result": "ok", "target": target, "before": to_hex(current), "hex": to_hex(rgb)}
    resp = _with_closest_name(resp, rgb, color_service, language)
    logger.info("SHIFT_TOWARD_COLOR: %s %s -> %s (%s)", target, to_hex(current), resp, args)
    return resp


async def _run_suggestion(
    action_id: str, nav_state: NavState, event_q: asyncio.Queue, ui: dict, language: str
) -> dict:
    """RUN_SUGGESTION: 提案して受け入れられた操作を実行し、tool response を返す。"""
    action = load_action_graph().actions.get(action_id)
    if action is None:
        return {"result": "error", "error": f"Unknown action id: {action_id}"}
    for c in action.get("run", []):
        cmd = tool_call_to_frontend_command(c["name"], c["args"])
        await event_q.put(LiveCommandEvent(command=cmd, tool_name=c["name"], tool_call_id=None))
    nav_state.mark_done(action_id)
    nav_state.turn_priority = PRIORITY_RUN_SUGGESTION
    nav_state.hold_suggestions(nav_state.next_suggestions(action_id, language, ui))
    logger.info(
        "RUN_SUGGESTION: %s calls=%s held=%s",
        action_id,
        [c["name"] for c in action.get("run", [])],
        [s["id"] for s in nav_state.pending_suggestions],
    )
    resp: dict = {"result": "ok", "done": action["label"][language]}
    if "instruction" in action:
        resp["instruction"] = action["instruction"][language]
    resp["next_step"] = ACTION_NEXT_STEP
    return resp


# UI tools whose tool response waits for the frontend's tool_result, so Gemini only
# continues (e.g. starts speaking) after the UI has finished applying the command.
# SHOW_CONTENT may run the color space deformation (~2s) before showing the slide.
_FRONTEND_CONFIRM_TIMEOUT_S: dict[str, float] = {
    "ADJUST_VALUE": 0.5,
    "SHOW_CONTENT": 4.0,
    # The frontend returns the color it picked, so the AI can name it
    "SELECT_BRIDGE_POSITION": 1.0,
}


async def iter_live_messages(live_session: object) -> AsyncIterator[object]:
    """
    google-genai の live セッションからメッセージを取り出すための互換レイヤ。

    SDKバージョンによりセッションは:
    - そのまま async iterable
    - .receive() が async iterable を返す
    - .recv() を await する
    のいずれかになり得る。
    """
    if live_session is None:
        return

    # Prefer receive(): SDKのドキュメント上の正規ルートで、ping/pong処理も進む。
    # 重要: google-genai 1.63.0 の receive() は「1モデルターン分をyieldしたら終了」するため、
    # 次ターンも受けるには receive() を繰り返し呼ぶ必要がある。
    recv_iter = getattr(live_session, "receive", None)
    if callable(recv_iter):
        while True:
            stream = recv_iter()
            # SDK差分で receive() が awaitable を返す可能性もある
            if inspect.isawaitable(stream):
                stream = await stream
            if not hasattr(stream, "__aiter__"):
                break
            async for msg in stream:  # type: ignore[operator]
                yield msg
            # 次ターンへ
            await asyncio.sleep(0)
        return

    # 2) async iterable (fallback)
    if hasattr(live_session, "__aiter__"):
        async for msg in live_session:  # type: ignore[operator]
            yield msg
        return

    # 3) recv() -> awaitable
    recv_one = getattr(live_session, "recv", None)
    if callable(recv_one):
        while True:
            yield await recv_one()
        # pragma: no cover


def _shape_changes_first(function_calls: list) -> list:
    """Run CHANGE_SHAPE before the other calls of the same message (stable otherwise).

    The screen should deform before a slide from SHOW_CONTENT appears; the frontend
    delays the slide until the deformation has finished.
    """

    def is_change_shape(fc) -> bool:
        name = fc.get("name") if isinstance(fc, dict) else getattr(fc, "name", None)
        return name == "CHANGE_SHAPE"

    return sorted(function_calls, key=lambda fc: 0 if is_change_shape(fc) else 1)


async def process_live_message(
    msg: object,
    event_q: asyncio.Queue,
    cfg: GeminiLiveConfig,
    live_session: object,
    current_color_state: dict | None,
    current_color_updated_at: float,
    color_history: list[dict],
    out_transcription_buf: str,
    out_transcription_segment_id: str | None,
    out_transcription_seq: int,
    in_transcription_buf: str,
    in_transcription_segment_id: str | None,
    in_transcription_seq: int,
    text_part_buf: str,
    text_part_segment_id: str | None,
    text_part_seq: int,
    color_service=None,
    pending_tool_futures: dict | None = None,
    nav_state: NavState | None = None,
) -> tuple[str, str | None, int, str, str | None, int, str, str | None, int]:
    """
    Process a single message from Gemini Live and emit events.
    Returns updated transcription state:
    (out_buf, out_seg_id, out_seq, in_buf, in_seg_id, in_seq, text_part_buf, text_part_seg_id, text_part_seq)
    """
    # msg構造はSDK依存。代表的に audio, text, transcript を拾う。
    # 可能な限り「落ちない」実装にしてログ/イベントで追えるようにする。
    if chat_debug_enabled():
        try:
            hits = deep_find_keys(
                msg,
                keys=(
                    "output_audio_transcription",
                    "outputAudioTranscription",
                    "output_transcription",
                    "outputTranscription",
                    "input_transcription",
                    "inputTranscription",
                    "input_audio_transcription",
                    "inputAudioTranscription",
                ),
            )
            if hits:
                # Log only a few hits to keep logs readable
                preview = []
                for pth, val in hits[:5]:
                    s = None
                    try:
                        if isinstance(val, str):
                            s = val[:200]
                        elif isinstance(val, dict):
                            s = str(list(val.keys())[:20])
                        else:
                            s = str(type(val).__name__)
                    except Exception:
                        s = "<unprintable>"
                    preview.append(f"{pth}={s}")
                logger.info("LIVE_CHAT_DEBUG deep_key_hits %s", "; ".join(preview))
        except Exception:
            logger.info("LIVE_CHAT_DEBUG deep_key_hits (failed)")

    # 0) google-genai>=1.x: LiveServerMessage.server_content.model_turn.parts[].inline_data に音声が入る
    sc = getattr(msg, "server_content", None)
    output_txt: str | None = None  # Store for later use in input transcription finalization
    if sc is not None:
        # 0-0) interrupted: Gemini がユーザーの割り込みを検知して生成を中断した
        interrupted_flag = getattr(sc, "interrupted", None)
        if interrupted_flag is None and isinstance(sc, dict):
            interrupted_flag = sc.get("interrupted")
        if interrupted_flag:
            await event_q.put(LiveInterruptedEvent())
            if nav_state is not None:
                nav_state.clear_pending()
            out_transcription_buf = ""
            out_transcription_segment_id = None

        # 0-a) output audio transcription (server-generated)
        # NOTE: server field names differ by SDK/API version.
        # We've observed `server_content.output_transcription` in v1alpha.
        oat = getattr(sc, "output_audio_transcription", None) or getattr(
            sc, "outputAudioTranscription", None
        )
        ot = getattr(sc, "output_transcription", None) or getattr(sc, "outputTranscription", None)
        if isinstance(sc, dict):
            oat = oat or sc.get("output_audio_transcription") or sc.get("outputAudioTranscription")
            ot = ot or sc.get("output_transcription") or sc.get("outputTranscription")

        transcription_obj = oat if oat is not None else ot
        transcription_source = (
            "output_audio_transcription"
            if oat is not None
            else ("output_transcription" if ot is not None else None)
        )
        txt = extract_text_from_transcription_obj(transcription_obj)
        finished = extract_finished_from_transcription_obj(transcription_obj)
        output_txt = txt  # Store for later use in input transcription finalization
        if chat_debug_enabled():
            try:
                logger.info(
                    "LIVE_CHAT_DEBUG oat has_oat=%s source=%s oat_type=%s finished=%s txt_len=%s txt_preview=%r",
                    transcription_obj is not None,
                    transcription_source,
                    type(transcription_obj).__name__ if transcription_obj is not None else None,
                    finished,
                    len(txt) if txt else 0,
                    (txt[:200] if txt else None),
                )
            except Exception:
                logger.info("LIVE_CHAT_DEBUG oat (failed to log details)")
        if txt:
            # output transcription can arrive in multiple small chunks; merge for stable chat display.
            if transcription_source in (
                "output_transcription",
                "output_audio_transcription",
            ):
                # If user started speaking again, treat it as a boundary and start a new assistant segment.
                # This compensates for SDK/API variants where `finished` never becomes True.
                if (
                    out_transcription_segment_id is not None
                    and in_transcription_segment_id is not None
                ):
                    out_transcription_buf = ""
                    out_transcription_segment_id = None
                if out_transcription_segment_id is None:
                    out_transcription_seq += 1
                    out_transcription_segment_id = f"asst_out_{out_transcription_seq}"
                    out_transcription_buf = ""
                out_transcription_buf = merge_streaming_text(out_transcription_buf, txt)
                txt_to_emit = out_transcription_buf
            else:
                txt_to_emit = txt
            await event_q.put(
                LiveAssistantTextEvent(
                    text=txt_to_emit,
                    source=transcription_source,
                    segment_id=out_transcription_segment_id
                    if transcription_source
                    in ("output_transcription", "output_audio_transcription")
                    else None,
                    is_final=finished if isinstance(finished, bool) else None,
                )
            )
            # Reset buffer at end of this output transcription stream.
            if finished is True:
                out_transcription_buf = ""
                out_transcription_segment_id = None
            # output_audio_transcriptionが来たときは、text_partのバッファをリセット（同じ発話として扱う）
            if transcription_source in (
                "output_transcription",
                "output_audio_transcription",
            ):
                text_part_buf = ""
                text_part_segment_id = None

        # 0-b) input audio transcription (user ASR)
        it = (
            getattr(sc, "input_audio_transcription", None)
            or getattr(sc, "inputAudioTranscription", None)
            or getattr(sc, "input_transcription", None)
            or getattr(sc, "inputTranscription", None)
        )
        if isinstance(sc, dict):
            it = it or sc.get("input_audio_transcription") or sc.get("inputAudioTranscription")
            it = it or sc.get("input_transcription") or sc.get("inputTranscription")
        it_txt = extract_text_from_transcription_obj(it)
        it_finished = extract_finished_from_transcription_obj(it)
        if chat_debug_enabled() and it is not None:
            try:
                logger.info(
                    "LIVE_CHAT_DEBUG it has_it=%s it_type=%s finished=%s txt_len=%s txt_preview=%r",
                    it is not None,
                    type(it).__name__ if it is not None else None,
                    it_finished,
                    len(it_txt) if it_txt else 0,
                    (it_txt[:200] if it_txt else None),
                )
            except Exception:
                logger.info("LIVE_CHAT_DEBUG it (failed to log details)")
        if it_txt:
            # The user is talking: drop the next-topic suggestion held after a slide
            if nav_state is not None:
                nav_state.clear_pending()
            # Stream user transcript as a single updatable bubble.
            if in_transcription_segment_id is None:
                in_transcription_seq += 1
                in_transcription_segment_id = f"user_in_{in_transcription_seq}"
                in_transcription_buf = ""
            in_transcription_buf = merge_streaming_text(in_transcription_buf, it_txt.strip())
            await event_q.put(
                LiveTranscriptEvent(
                    text=in_transcription_buf,
                    is_final=False,
                    language=cfg.language,
                    segment_id=in_transcription_segment_id,
                )
            )

            # If assistant starts outputting, finalize the current user segment once.
            # Note: output_txt is from output transcription above
            if (
                output_txt
                and in_transcription_segment_id is not None
                and in_transcription_buf.strip()
            ):
                await event_q.put(
                    LiveTranscriptEvent(
                        text=in_transcription_buf.strip(),
                        is_final=True,
                        language=cfg.language,
                        segment_id=in_transcription_segment_id,
                    )
                )
                in_transcription_buf = ""
                in_transcription_segment_id = None

        model_turn = getattr(sc, "model_turn", None) or getattr(sc, "modelTurn", None)
        parts = getattr(model_turn, "parts", None) if model_turn is not None else None
        if parts:
            for p in parts:
                inline = getattr(p, "inline_data", None) or getattr(p, "inlineData", None)
                candidate = inline or p
                mt = extract_mime(candidate) or extract_mime(inline)
                b = extract_blob_bytes(candidate)
                if b and (mt or "").startswith("audio/"):
                    if nav_state is not None and nav_state.pending_suggestions:
                        nav_state.pending_spoken = True
                    if chat_debug_enabled():
                        logger.info(
                            "LIVE_CHAT_DEBUG audio_part bytes=%s mime=%s",
                            len(b),
                            mt,
                        )
                    await event_q.put(
                        LiveAudioChunk(
                            direction="out",
                            data=b,
                            sample_rate_hz=cfg.output_sample_rate_hz,
                        )
                    )
                # text part fallback
                t = getattr(p, "text", None)
                if isinstance(t, str) and t.strip():
                    if chat_debug_enabled():
                        try:
                            logger.info(
                                "LIVE_CHAT_DEBUG text_part txt_len=%s txt_preview=%r",
                                len(t.strip()),
                                t.strip()[:200],
                            )
                        except Exception:
                            logger.info("LIVE_CHAT_DEBUG text_part (failed to log details)")
                    # text_partもバッファリングして結合し、segmentIdを設定する
                    if text_part_segment_id is None:
                        text_part_seq += 1
                        text_part_segment_id = f"asst_text_{text_part_seq}"
                        text_part_buf = ""
                    text_part_buf = merge_streaming_text(text_part_buf, t.strip())
                    await event_q.put(
                        LiveAssistantTextEvent(
                            text=text_part_buf,
                            source="text_part",
                            segment_id=text_part_segment_id,
                            is_final=None,
                        )
                    )

    # 0-b) google-genai>=1.x: tool call / function call (UI操作)
    tc = getattr(msg, "tool_call", None) or getattr(msg, "toolCall", None)
    function_calls = _shape_changes_first(tool_call_function_calls(tc))
    if function_calls:
        tool_call_start = time.time()
        logger.info("TOOL_CALL: Received %d function call(s)", len(function_calls))
        # Best-effort: respond "ok" so the model can continue the turn.
        try:
            from google.genai import types  # type: ignore

            FunctionResponse = getattr(types, "FunctionResponse", None)
        except Exception:
            FunctionResponse = None

        send_tool = getattr(live_session, "send_tool_response", None)

        for fc in function_calls:
            name = getattr(fc, "name", None) if not isinstance(fc, dict) else fc.get("name")
            args = getattr(fc, "args", None) if not isinstance(fc, dict) else fc.get("args")
            call_id = getattr(fc, "id", None) if not isinstance(fc, dict) else fc.get("id")
            if not isinstance(args, dict):
                args = {}

            if isinstance(name, str) and name:
                # Log tool call details
                logger.info(
                    "TOOL_CALL: name=%s, args=%s, call_id=%s",
                    name,
                    args,
                    call_id,
                )
                ui = ui_state_of(current_color_state)
                lang = getattr(cfg, "language", "ja")
                # After an action (not a slide), hold what to suggest next
                held = nav_state is not None and _hold_after_action(nav_state, name, args, ui, lang)

                if name in ("MIX_COLORS", "SHIFT_TOWARD_COLOR"):
                    if name == "MIX_COLORS":
                        resp = await _mix_colors(args, event_q, color_service, lang)
                    else:
                        resp = await _shift_toward(args, event_q, ui, color_service, lang)
                    if held:
                        resp["next_step"] = ACTION_NEXT_STEP
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response=resp, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                    except Exception as e:
                        logger.info("%s send_tool_response failed: %s", name, str(e))
                    continue

                if name == "RUN_SUGGESTION" and nav_state is not None:
                    resp = await _run_suggestion(str(args.get("id")), nav_state, event_q, ui, lang)
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response=resp, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                    except Exception as e:
                        logger.info("RUN_SUGGESTION send_tool_response failed: %s", str(e))
                    continue

                # Non-UI tool: return current color snapshot without emitting a frontend command.
                if name == "GET_UI_STATE":
                    resp = {
                        "available": bool(current_color_state),
                        "color": current_color_state,
                        "updated_at": current_color_updated_at or 0.0,
                    }
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response=resp, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                    except Exception as e:
                        logger.info("GeminiLiveSession send_tool_response failed: %s", str(e))
                    continue

                if name == "GET_COLOR_HISTORY":
                    resp = {
                        "available": bool(color_history),
                        "history": color_history,
                        "count": len(color_history),
                    }
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response=resp, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                    except Exception as e:
                        logger.info("GeminiLiveSession send_tool_response failed: %s", str(e))
                    continue

                if name == "GET_CLOSEST_COLOR":
                    bg = parse_hex(ui.get("background")) if args.get("target") == "background" else None
                    if color_service is not None and current_color_state:
                        r, g, b = bg or (
                            current_color_state.get("r", 0),
                            current_color_state.get("g", 0),
                            current_color_state.get("b", 0),
                        )
                        closest = color_service.find_closest_colors(r, g, b, top_n=5, language=lang)
                        resp = {
                            "target": "background" if bg else "focused",
                            "r": r,
                            "g": g,
                            "b": b,
                            "closest": closest,
                        }
                        if held:
                            resp["next_step"] = ACTION_NEXT_STEP
                        logger.info(
                            "GET_CLOSEST_COLOR: rgb=(%d,%d,%d) top=%s",
                            r,
                            g,
                            b,
                            [c["name"] for c in closest[:3]],
                        )
                    else:
                        resp = {
                            "error": "No current color or color service unavailable",
                            "closest": [],
                        }
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response=resp, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                    except Exception as e:
                        logger.info("GET_CLOSEST_COLOR send_tool_response failed: %s", str(e))
                    continue

                if name == "RECORD_DECLINE":
                    declined_id = args.get("id")
                    if nav_state is not None and isinstance(declined_id, str):
                        nav_state.mark_declined(declined_id)
                    logger.info("RECORD_DECLINE: id=%s", declined_id)
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response={"result": "ok"}, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                    except Exception as e:
                        logger.info("RECORD_DECLINE send_tool_response failed: %s", str(e))
                    continue

                if name == "SEARCH_COLOR":
                    query = args.get("query", "")
                    logger.info(
                        "SEARCH_COLOR: query=%r color_service=%s",
                        query,
                        type(color_service).__name__,
                    )
                    if color_service is not None and query:
                        matches = color_service.search_by_name(query)
                        results = [
                            {
                                "name": c.name1,
                                "name2": c.name2 or "",
                                "hex": c.hex,
                                "r": c.rgb["r"],
                                "g": c.rgb["g"],
                                "b": c.rgb["b"],
                                "tags": c.tag,
                            }
                            for c in matches[:10]
                        ]
                        resp = {
                            "query": query,
                            "count": len(results),
                            "results": results,
                        }
                        logger.info(
                            "SEARCH_COLOR: found %d results for %r: %s",
                            len(results),
                            query,
                            [r["name"] for r in results],
                        )
                    else:
                        resp = {
                            "query": query,
                            "count": 0,
                            "results": [],
                            "error": "Search unavailable",
                        }
                        logger.info(
                            "SEARCH_COLOR: unavailable — color_service=%s query=%r",
                            color_service,
                            query,
                        )
                    try:
                        if callable(send_tool) and FunctionResponse is not None:
                            fr = FunctionResponse(name=name, response=resp, id=call_id)
                            maybe = send_tool(function_responses=fr)
                            if inspect.isawaitable(maybe):
                                await maybe
                            logger.info("SEARCH_COLOR: send_tool_response sent OK")
                        else:
                            logger.info(
                                "SEARCH_COLOR: send_tool skipped — callable=%s FunctionResponse=%s",
                                callable(send_tool),
                                FunctionResponse,
                            )
                    except Exception as e:
                        logger.info("SEARCH_COLOR send_tool_response failed: %s", str(e))
                    continue

                # UI tool: map to a frontend command
                cmd = tool_call_to_frontend_command(name, args)
                logger.info(
                    "TOOL_CALL: Sending command to frontend: action=%s, parameters=%s",
                    cmd.get("action"),
                    cmd.get("parameters"),
                )

                # For tools in _FRONTEND_CONFIRM_TIMEOUT_S: create the future before emitting
                # the event so it is in place by the time the frontend sends back a tool_result.
                tool_resp: dict = {"result": "ok"}
                if nav_state is not None and name == "SHOW_CONTENT":
                    nav_state.turn_priority = PRIORITY_SHOW_CONTENT
                    # The slide switches the color space too: judge the candidates by that space
                    slide_ui = {**ui, "shape": args["colorSpace"]} if args.get("colorSpace") else ui
                    tool_resp = build_show_content_response(
                        str(args.get("id")), nav_state, cfg.language, slide_ui
                    )
                    # The slide shows the recommendations as tags at its bottom
                    if isinstance(cmd.get("parameters"), dict):
                        cmd["parameters"]["tags"] = nav_state.slide_tags
                    logger.info(
                        "SHOW_CONTENT: id=%s held_suggestions=%s",
                        args.get("id"),
                        [s["id"] for s in nav_state.pending_suggestions],
                    )
                elif nav_state is not None and name == "DISMISS_CONTENT":
                    nav_state.mark_dismissed()
                confirm_timeout = _FRONTEND_CONFIRM_TIMEOUT_S.get(name)
                wait_for_frontend = (
                    confirm_timeout is not None and call_id and pending_tool_futures is not None
                )
                if wait_for_frontend:
                    loop = asyncio.get_running_loop()
                    future: asyncio.Future = loop.create_future()
                    pending_tool_futures[call_id] = future

                await event_q.put(
                    LiveCommandEvent(command=cmd, tool_name=name, tool_call_id=call_id)
                )

                if wait_for_frontend:
                    try:
                        frontend_resp = await asyncio.wait_for(
                            asyncio.shield(future), timeout=confirm_timeout
                        )
                        # SHOW_CONTENT keeps its own response (script);
                        # the confirmation only delays it until the slide is on screen.
                        if name == "ADJUST_VALUE" and isinstance(frontend_resp, dict):
                            tool_resp = dict(frontend_resp)
                        if name == "SELECT_BRIDGE_POSITION" and isinstance(frontend_resp, dict):
                            picked = parse_hex((frontend_resp.get("data") or {}).get("hex"))
                            if picked is not None:
                                tool_resp["hex"] = to_hex(picked)
                                tool_resp = _with_closest_name(
                                    tool_resp, picked, color_service, lang
                                )
                    except (asyncio.TimeoutError, asyncio.CancelledError):
                        logger.info("%s: timeout waiting for frontend confirmation", name)
                    finally:
                        pending_tool_futures.pop(call_id, None)

                # The name of the color just set, so the AI does not describe it by guess
                chosen = _color_set_by(name, cmd.get("parameters"))
                if chosen is not None:
                    tool_resp["hex"] = to_hex(chosen)
                    tool_resp = _with_closest_name(tool_resp, chosen, color_service, lang)
                if held:
                    tool_resp["next_step"] = ACTION_NEXT_STEP
                # Send tool response back to Gemini Live
                try:
                    if callable(send_tool) and FunctionResponse is not None:
                        fr = FunctionResponse(
                            name=name,
                            response=tool_resp,
                            id=call_id,
                        )
                        maybe = send_tool(function_responses=fr)
                        if inspect.isawaitable(maybe):
                            await maybe
                except Exception as e:
                    logger.info("GeminiLiveSession send_tool_response failed: %s", str(e))

        tool_call_end = time.time()
        logger.info(
            "PERF: tool_call_processing elapsed=%.3fs num_calls=%d",
            tool_call_end - tool_call_start,
            len(function_calls),
        )

    # turn_complete: when the slide's narration has been generated, tell the frontend that a
    # next-topic suggestion is waiting. The frontend replies once the narration has finished
    # playing (plus a short pause), and only then is the suggestion spoken as its own turn.
    if sc is not None and nav_state is not None:
        turn_complete = getattr(sc, "turn_complete", None)
        if turn_complete is None and isinstance(sc, dict):
            turn_complete = sc.get("turn_complete") or sc.get("turnComplete")
        if turn_complete:
            nav_state.turn_priority = 0
        if turn_complete and nav_state.pending_suggestions and nav_state.pending_spoken:
            nav_state.pending_spoken = False
            await event_q.put(LiveSuggestionPendingEvent(token=nav_state.pending_token))

    # 音声出力
    audio = getattr(msg, "audio", None) or msg.get("audio") if isinstance(msg, dict) else None
    if audio:
        data = audio.get("data") if isinstance(audio, dict) else None
        if isinstance(data, (bytes, bytearray)):
            await event_q.put(
                LiveAudioChunk(
                    direction="out",
                    data=bytes(data),
                    sample_rate_hz=cfg.output_sample_rate_hz,
                )
            )

    # ASR/Transcript
    transcript = (
        getattr(msg, "transcript", None) or msg.get("transcript") if isinstance(msg, dict) else None
    )
    if transcript:
        text = transcript.get("text") if isinstance(transcript, dict) else None
        is_final = bool(transcript.get("is_final")) if isinstance(transcript, dict) else False
        if isinstance(text, str) and text.strip():
            await event_q.put(
                LiveTranscriptEvent(
                    text=text.strip(),
                    is_final=is_final,
                    language=cfg.language,
                )
            )

    # テキスト出力（アシスタント）
    text_out = getattr(msg, "text", None) or msg.get("text") if isinstance(msg, dict) else None
    if isinstance(text_out, str) and text_out.strip():
        # text_partもバッファリングして結合し、segmentIdを設定する
        if text_part_segment_id is None:
            text_part_seq += 1
            text_part_segment_id = f"asst_text_{text_part_seq}"
            text_part_buf = ""
        text_part_buf = merge_streaming_text(text_part_buf, text_out.strip())
        await event_q.put(
            LiveAssistantTextEvent(
                text=text_part_buf,
                source="text_part",
                segment_id=text_part_segment_id,
                is_final=None,
            )
        )

    return (
        out_transcription_buf,
        out_transcription_segment_id,
        out_transcription_seq,
        in_transcription_buf,
        in_transcription_segment_id,
        in_transcription_seq,
        text_part_buf,
        text_part_segment_id,
        text_part_seq,
    )

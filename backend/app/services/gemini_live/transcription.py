"""
Gemini Live 転写/テキスト抽出関連のヘルパー関数。
"""

from __future__ import annotations


def extract_text_from_transcription_obj(x) -> str | None:
    """
    受信メッセージ内の「書き起こし」オブジェクトからテキストを取り出すためのbest-effort。
    `output_audio_transcription` 由来の構造は SDK/モデルで変わり得るため、落ちない抽出を優先する。
    """
    if x is None:
        return None
    if isinstance(x, str):
        return x.strip() or None
    if isinstance(x, dict):
        # common shapes
        for k in ("text", "transcript", "transcription"):
            v = x.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        # nested: {"transcript": {"text": "..."}}
        v2 = x.get("transcript")
        if isinstance(v2, dict):
            t = v2.get("text")
            if isinstance(t, str) and t.strip():
                return t.strip()
        return None
    # pydantic/model objects
    t = getattr(x, "text", None)
    if isinstance(t, str) and t.strip():
        return t.strip()
    tr = getattr(x, "transcript", None)
    if isinstance(tr, str) and tr.strip():
        return tr.strip()
    tr2 = getattr(x, "transcription", None)
    if isinstance(tr2, str) and tr2.strip():
        return tr2.strip()
    tr_obj = getattr(x, "transcript", None)
    if tr_obj is not None:
        t2 = getattr(tr_obj, "text", None)
        if isinstance(t2, str) and t2.strip():
            return t2.strip()
    return None


def extract_finished_from_transcription_obj(x) -> bool | None:
    """
    output_transcription / output_audio_transcription オブジェクトから finished フラグを取り出す best-effort。
    """
    if x is None:
        return None
    if isinstance(x, dict):
        v = x.get("finished")
        if isinstance(v, bool):
            return v
        return None
    v2 = getattr(x, "finished", None)
    if isinstance(v2, bool):
        return v2
    return None


def merge_streaming_text(prev: str, chunk: str) -> str:
    """
    ストリーミングで届くテキストを「累積表示用」に統合する。
    - server が「全文（ここまで）」を送る場合: chunk へ置換
    - server が「差分chunk」を送る場合: prev + space + chunk
    """
    prev = prev or ""
    chunk = (chunk or "").strip()
    if not chunk:
        return prev
    if not prev:
        return chunk
    # If server sends cumulative text so far, prefer replacement.
    if chunk.startswith(prev) and len(chunk) >= len(prev):
        return chunk
    # If chunk already appended, avoid duplication.
    if prev.endswith(chunk):
        return prev
    # Differential chunk: always add a word boundary space.
    return prev + " " + chunk

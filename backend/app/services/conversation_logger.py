"""
LMOps用会話ログ収集・S3アップロード。

セッション中のイベントをメモリに蓄積し、セッション終了時に1ファイルのJSONL形式で
S3へ書き込む。CONV_LOG_S3_BUCKET が未設定の場合はno-op（ローカル開発向け）。

S3キー形式: conversations/{YYYY}/{MM}/{DD}/{session_id}.jsonl
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger("uvicorn.error")


class ConversationLogger:
    def __init__(self, session_id: int, language: str, start_time: float) -> None:
        self._session_id = session_id
        self._language = language
        self._start_time = start_time
        self._lines: list[str] = []
        self._add({
            "event": "session_start",
            "session_id": str(session_id),
            "language": language,
            "start_time": _iso(start_time),
        })

    def add_user_transcript(self, text: str) -> None:
        self._add({"event": "user_transcript", "text": text})

    def add_user_text_message(self, text: str) -> None:
        self._add({"event": "user_text_message", "text": text})

    def add_assistant_text(self, text: str, segment_id: str | None = None) -> None:
        self._add({"event": "assistant_text", "text": text, "segment_id": segment_id})

    def add_tool_call(
        self,
        tool_name: str | None,
        command: dict,
        tool_call_id: str | None = None,
    ) -> None:
        self._add({
            "event": "tool_call",
            "tool_name": tool_name,
            "command": command,
            "tool_call_id": tool_call_id,
        })

    async def flush(self) -> None:
        from app.config.settings import settings

        bucket: str = getattr(settings, "CONV_LOG_S3_BUCKET", "")
        if not bucket:
            return

        self._add({"event": "session_end", "session_id": str(self._session_id)})

        body = "\n".join(self._lines) + "\n"
        now = datetime.now(timezone.utc)
        key = (
            f"conversations/{now.year:04d}/{now.month:02d}/{now.day:02d}"
            f"/{self._session_id}.jsonl"
        )

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _upload, bucket, key, body)

    def _add(self, record: dict) -> None:
        record["ts"] = _iso_now()
        self._lines.append(json.dumps(record, ensure_ascii=False))


def _iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _upload(bucket: str, key: str, body: str) -> None:
    try:
        import boto3  # type: ignore

        boto3.client("s3").put_object(
            Bucket=bucket,
            Key=key,
            Body=body.encode("utf-8"),
            ContentType="application/x-ndjson",
        )
        logger.info(
            "ConversationLogger: uploaded s3://%s/%s (%d lines, %d bytes)",
            bucket,
            key,
            body.count("\n"),
            len(body),
        )
    except Exception as exc:
        logger.warning("ConversationLogger: S3 upload failed: %s", exc)

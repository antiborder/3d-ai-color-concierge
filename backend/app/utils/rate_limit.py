from __future__ import annotations

import time
from dataclasses import dataclass
from threading import Lock
from typing import Dict


@dataclass
class _Bucket:
    window_start: float
    count: int


class FixedWindowRateLimiter:
    """
    超簡易の固定窓レート制限（インメモリ）。
    - CloudFront越しの場合、IPはX-Forwarded-Forを優先して渡す想定。
    """

    def __init__(self, limit: int, window_seconds: int):
        self._limit = limit
        self._window = window_seconds
        self._lock = Lock()
        self._buckets: Dict[str, _Bucket] = {}

    def allow(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            b = self._buckets.get(key)
            if not b or now - b.window_start >= self._window:
                self._buckets[key] = _Bucket(window_start=now, count=1)
                return True
            if b.count >= self._limit:
                return False
            b.count += 1
            return True


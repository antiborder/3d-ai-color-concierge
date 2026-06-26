from __future__ import annotations

from collections.abc import Iterable
from urllib.parse import urlparse


def is_origin_allowed(origin: str, allowed: Iterable[str]) -> bool:
    """
    allowed は CORS_ORIGINS のような配列を想定し、以下を許可:
    - 完全一致
    - https://*.cloudfront.net のようなワイルドカード（ホスト末尾一致）
    """
    origin = origin.strip()
    if not origin:
        return False

    try:
        o = urlparse(origin)
        origin_host = (o.hostname or "").lower()
        origin_scheme = (o.scheme or "").lower()
    except Exception:
        return False

    for a in allowed:
        a = a.strip()
        if not a:
            continue
        if a == origin:
            return True
        if "*." in a:
            try:
                ap = urlparse(a)
                a_scheme = (ap.scheme or "").lower()
                a_host = (ap.hostname or "").lower()
            except Exception:
                continue
            if not a_host.startswith("*."):
                continue
            suffix = a_host[2:]
            if origin_scheme == a_scheme and origin_host.endswith(suffix):
                return True
    return False

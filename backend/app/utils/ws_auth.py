from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import time


def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("ascii").rstrip("=")


def _b64u_decode(s: str) -> bytes:
    pad = "=" * ((4 - (len(s) % 4)) % 4)
    return base64.urlsafe_b64decode(s + pad)


def mint_ws_token(ttl_seconds: int = 60) -> str:
    """
    署名付きの短命トークンを発行。
    フォーマット: <exp>.<nonce>.<sig>
    """
    secret = os.getenv("WS_TOKEN_SECRET", "")
    if not secret:
        raise RuntimeError("WS_TOKEN_SECRET is not set")

    exp = int(time.time()) + ttl_seconds
    nonce = secrets.token_urlsafe(16)
    msg = f"{exp}.{nonce}".encode()
    sig = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).digest()
    return f"{exp}.{nonce}.{_b64u(sig)}"


def verify_ws_token(token: str) -> bool:
    secret = os.getenv("WS_TOKEN_SECRET", "")
    if not secret:
        return False

    try:
        exp_s, nonce, sig_s = token.split(".", 2)
        exp = int(exp_s)
    except Exception:
        return False

    if exp < int(time.time()):
        return False

    msg = f"{exp}.{nonce}".encode()
    expected = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).digest()
    try:
        got = _b64u_decode(sig_s)
    except Exception:
        return False
    return hmac.compare_digest(expected, got)


def extract_cookie(cookie_header: str | None, name: str) -> str | None:
    if not cookie_header:
        return None
    # naive cookie parse (good enough here)
    parts = cookie_header.split(";")
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if "=" not in p:
            continue
        k, v = p.split("=", 1)
        if k.strip() == name:
            return v.strip()
    return None

from __future__ import annotations

import os
import urllib.parse
from fastapi import APIRouter, Response, Request
from fastapi.responses import JSONResponse

from app.utils.ws_auth import mint_ws_token
from app.utils.origin_check import is_origin_allowed
from app.config.settings import settings


router = APIRouter()


@router.get("/token")
async def issue_ws_token(request: Request):
    """
    WebSocket用の短命トークンをCookieとして発行する。
    フロントはこのエンドポイントを credentials: include で叩いた後に WS 接続する。
    """
    origin = request.headers.get("origin", "")
    if origin and not is_origin_allowed(origin, settings.get_cors_origins()):
        return Response(status_code=403)

    token = mint_ws_token(ttl_seconds=int(os.getenv("WS_TOKEN_TTL_SEC", "60")))

    # CloudFront越しは https のため Secure を有効化。ローカル(http)を壊さないためにヘッダで判定。
    forwarded_proto = (
        request.headers.get("x-forwarded-proto")
        or request.headers.get("cloudfront-forwarded-proto")
        or request.url.scheme
    )
    secure = forwarded_proto == "https"

    # ローカル(dev)からCloudFront(ECS)へWSを張る場合はクロスサイト扱いになり、
    # SameSite=LaxだとWSハンドシェイクにcookieが乗らない。
    # https(=Secure)のときは、OriginとHostが異なる場合に SameSite=None を使う。
    samesite = "lax"
    try:
        host = (request.headers.get("host") or "").split(":")[0]
        origin_host = urllib.parse.urlparse(origin).hostname or ""
        if secure and origin_host and host and origin_host != host:
            samesite = "none"
    except Exception:
        # fallback: keep lax
        pass

    # JSからトークンを受け取りたい場合（第三者Cookie制限の回避用）
    return_token = request.query_params.get("return_token") in ("1", "true", "yes")

    resp = JSONResponse({"token": token}) if return_token else Response(status_code=204)
    resp.set_cookie(
        key="ws_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/ws",
        max_age=60,
    )
    return resp


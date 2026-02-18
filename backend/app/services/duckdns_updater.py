"""
DuckDNS updater.

目的:
- Fargate Spotでタスクが入れ替わりPublic IPが変わっても、DuckDNS側のAレコードを追従させる。

仕組み:
- タスク（コンテナ）からDuckDNSのupdate APIを定期的に叩く。
- `ip` を指定しない場合、DuckDNSはリクエスト元の送信元IPを採用するため、
  Public IPが割り当てられたFargateタスクであればそのまま使える。
"""

from __future__ import annotations

import asyncio
import logging
import os
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)


def _duckdns_update_url(domain: str, token: str) -> str:
    q = urllib.parse.urlencode({"domains": domain, "token": token})
    return f"https://www.duckdns.org/update?{q}"


def _do_update(domain: str, token: str) -> str:
    url = _duckdns_update_url(domain, token)
    with urllib.request.urlopen(url, timeout=10) as resp:
        body = resp.read().decode("utf-8", errors="replace").strip()
        return body


async def run_duckdns_updater(stop_evt: asyncio.Event) -> None:
    domain = os.getenv("DUCKDNS_DOMAIN", "").strip()
    token = os.getenv("DUCKDNS_TOKEN", "").strip()
    interval_s = int(os.getenv("DUCKDNS_UPDATE_INTERVAL_SEC", "60"))

    if not domain or not token:
        logger.info("DuckDNS updater disabled (DUCKDNS_DOMAIN/DUCKDNS_TOKEN not set).")
        return

    logger.info("DuckDNS updater enabled for domain=%s, interval=%ss", domain, interval_s)

    try:
    # 起動直後に即時更新
        while not stop_evt.is_set():
            try:
                result = await asyncio.to_thread(_do_update, domain, token)
                if result != "OK":
                    logger.warning("DuckDNS update returned: %s", result)
                else:
                    logger.info("DuckDNS updated: OK")
            except Exception as e:
                logger.warning("DuckDNS update failed: %s", e)

            try:
                await asyncio.wait_for(stop_evt.wait(), timeout=interval_s)
            except asyncio.TimeoutError:
                continue
    except asyncio.CancelledError:
        # shutdown時にcancelされても正常終了扱いにする
        return


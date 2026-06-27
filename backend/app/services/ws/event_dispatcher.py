from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.services.ws.listeners.base import AbstractEventListener

logger = logging.getLogger("uvicorn.error")


class EventDispatcher:
    def __init__(self, ctx: Any) -> None:
        self._ctx = ctx
        self._registry: dict[type, AbstractEventListener] = {}
        self.queue: asyncio.Queue = asyncio.Queue()

    def register_all(self, registry: dict[type, type[AbstractEventListener]]) -> None:
        for event_type, listener_cls in registry.items():
            self._registry[event_type] = listener_cls(self._ctx)

    async def run(self) -> None:
        while not self._ctx.stop_event.is_set():
            try:
                event = await asyncio.wait_for(self.queue.get(), timeout=0.1)
            except TimeoutError:
                continue
            listener = self._registry.get(type(event))
            if listener is not None:
                try:
                    await listener.handle(event)
                except Exception as e:
                    logger.info(
                        "EventDispatcher: listener error for %s: %s", type(event).__name__, e
                    )
            else:
                logger.info("EventDispatcher: no listener for %s", type(event).__name__)

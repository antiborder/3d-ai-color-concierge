from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod

from app.services.ws.listeners.base import AbstractEventListener


class AbstractWebSocket(ABC):
    event_registry: dict[type, type[AbstractEventListener]] = {}

    @abstractmethod
    async def receive_loop(self, queue: asyncio.Queue) -> None: ...

    @abstractmethod
    async def send_bytes(self, data: bytes) -> None: ...

    @abstractmethod
    async def send_text(self, text: str) -> None: ...

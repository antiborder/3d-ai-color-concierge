from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class AbstractEventListener(ABC):
    def __init__(self, ctx: Any) -> None:
        self._ctx = ctx

    @abstractmethod
    async def handle(self, event: Any) -> None: ...

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class UserAudioEvent:
    data: bytes


@dataclass
class UserTextMessageEvent:
    text: str


@dataclass
class UserColorStateEvent:
    color: dict


@dataclass
class UserColorHistoryEvent:
    history: list[dict]


@dataclass
class UserStopEvent:
    pass


@dataclass
class UserSuggestionReadyEvent:
    """The slide narration has finished playing (and a short pause has passed)."""

    token: int


@dataclass
class UserToolResultEvent:
    tool_call_id: str
    success: bool
    data: dict

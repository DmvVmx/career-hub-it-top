from datetime import datetime

from pydantic import BaseModel, Field


class PixelBattleClanResponse(BaseModel):
    id: int
    emoji: str
    name: str
    description: str | None = None
    is_default: bool = True
    created_at: datetime


class PixelBattleClanMemberResponse(BaseModel):
    id: int
    clan: PixelBattleClanResponse
    joined_at: datetime


class PixelBattleSeasonResponse(BaseModel):
    id: int
    title: str
    width: int
    height: int
    status: str
    starts_at: datetime
    ends_at: datetime | None = None
    winner_clan_id: int | None = None
    created_at: datetime


class PixelBattlePixelClanResponse(BaseModel):
    id: int
    emoji: str
    name: str


class PixelBattlePixelResponse(BaseModel):
    x: int
    y: int
    color: str

    updated_by_user_id: int
    updated_by_student_profile_id: int
    updated_by_name: str | None = None

    clan: PixelBattlePixelClanResponse
    updated_at: datetime


class PixelBattleCanvasResponse(BaseModel):
    season: PixelBattleSeasonResponse
    pixels: list[PixelBattlePixelResponse]


class PixelBattlePlacePixelRequest(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


class PixelBattleMyStateResponse(BaseModel):
    clan: PixelBattleClanResponse | None = None
    cooldown_seconds_left: int
    can_place_pixel: bool


class PixelBattleLeaderboardItemResponse(BaseModel):
    clan: PixelBattlePixelClanResponse
    placed_count: int
    controlled_count: int
    members_count: int
    rank: int


class PixelBattleLeaderboardResponse(BaseModel):
    season: PixelBattleSeasonResponse
    items: list[PixelBattleLeaderboardItemResponse]


class PixelBattleJoinClanRequest(BaseModel):
    clan_id: int


class PixelBattleWsPixelEvent(BaseModel):
    type: str = "pixel_updated"
    pixel: PixelBattlePixelResponse
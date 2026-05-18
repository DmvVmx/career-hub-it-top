from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models import (
    PixelBattleClan,
    PixelBattleClanMember,
    PixelBattlePixel,
    PixelBattleSeason,
    User,
)
from app.schemas.pixel_battle import (
    PixelBattleCanvasResponse,
    PixelBattleClanMemberResponse,
    PixelBattleClanResponse,
    PixelBattleJoinClanRequest,
    PixelBattleLeaderboardItemResponse,
    PixelBattleLeaderboardResponse,
    PixelBattleMyStateResponse,
    PixelBattlePixelClanResponse,
    PixelBattlePixelResponse,
    PixelBattlePlacePixelRequest,
    PixelBattleSeasonResponse,
)
from app.services.pixel_battle_service import (
    get_my_pixel_battle_state,
    get_or_create_current_pixel_battle_season,
    get_pixel_battle_canvas,
    get_pixel_battle_clans,
    get_pixel_battle_leaderboard,
    get_pixel_battle_pixel_response_data,
    join_pixel_battle_clan,
    place_pixel_battle_pixel,
)

from app.api.v1.pixel_battle_ws import pixel_battle_manager


router = APIRouter(prefix="/pixel-battle", tags=["Pixel Battle"])


def build_clan_response(clan: PixelBattleClan) -> PixelBattleClanResponse:
    return PixelBattleClanResponse(
        id=clan.id,
        emoji=clan.emoji,
        name=clan.name,
        description=clan.description,
        is_default=clan.is_default,
        created_at=clan.created_at,
    )


def build_pixel_clan_response(clan: PixelBattleClan) -> PixelBattlePixelClanResponse:
    return PixelBattlePixelClanResponse(
        id=clan.id,
        emoji=clan.emoji,
        name=clan.name,
    )


def build_season_response(season: PixelBattleSeason) -> PixelBattleSeasonResponse:
    return PixelBattleSeasonResponse(
        id=season.id,
        title=season.title,
        width=season.width,
        height=season.height,
        status=season.status,
        starts_at=season.starts_at,
        ends_at=season.ends_at,
        winner_clan_id=season.winner_clan_id,
        created_at=season.created_at,
    )


async def build_clan_member_response(
    db: AsyncSession,
    member: PixelBattleClanMember,
) -> PixelBattleClanMemberResponse:
    clan = await db.get(PixelBattleClan, member.clan_id)

    return PixelBattleClanMemberResponse(
        id=member.id,
        clan=build_clan_response(clan),
        joined_at=member.joined_at,
    )


async def build_pixel_response(
    db: AsyncSession,
    pixel: PixelBattlePixel,
) -> PixelBattlePixelResponse:
    data = await get_pixel_battle_pixel_response_data(db=db, pixel=pixel)

    return PixelBattlePixelResponse(**data)


@router.get("/clans", response_model=list[PixelBattleClanResponse])
async def pixel_battle_get_clans(
    db: AsyncSession = Depends(get_db),
):
    clans = await get_pixel_battle_clans(db=db)
    return [build_clan_response(clan) for clan in clans]


@router.post("/clans/join", response_model=PixelBattleClanMemberResponse)
async def pixel_battle_join_clan(
    payload: PixelBattleJoinClanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        member = await join_pixel_battle_clan(
            db=db,
            user=current_user,
            clan_id=payload.clan_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await build_clan_member_response(db=db, member=member)


@router.get("/me", response_model=PixelBattleMyStateResponse)
async def pixel_battle_get_my_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        state = await get_my_pixel_battle_state(
            db=db,
            user=current_user,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    clan = state["clan"]

    return PixelBattleMyStateResponse(
        clan=build_clan_response(clan) if clan else None,
        cooldown_seconds_left=state["cooldown_seconds_left"],
        can_place_pixel=state["can_place_pixel"],
    )


@router.get("/season/current", response_model=PixelBattleSeasonResponse)
async def pixel_battle_get_current_season(
    db: AsyncSession = Depends(get_db),
):
    season = await get_or_create_current_pixel_battle_season(db=db)
    return build_season_response(season)


@router.get("/season/current/canvas", response_model=PixelBattleCanvasResponse)
async def pixel_battle_get_canvas(
    db: AsyncSession = Depends(get_db),
):
    season, pixels = await get_pixel_battle_canvas(db=db)

    return PixelBattleCanvasResponse(
        season=build_season_response(season),
        pixels=[
            await build_pixel_response(db=db, pixel=pixel)
            for pixel in pixels
        ],
    )


@router.post("/season/current/pixels", response_model=PixelBattlePixelResponse)
async def pixel_battle_place_pixel(
    payload: PixelBattlePlacePixelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        pixel = await place_pixel_battle_pixel(
            db=db,
            user=current_user,
            x=payload.x,
            y=payload.y,
            color=payload.color,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    pixel_response = await build_pixel_response(db=db, pixel=pixel)

    await pixel_battle_manager.broadcast(
        {
            "type": "pixel_updated",
            "pixel": pixel_response.model_dump(mode="json"),
        }
    )

    return pixel_response


@router.get("/season/current/leaderboard", response_model=PixelBattleLeaderboardResponse)
async def pixel_battle_get_leaderboard(
    db: AsyncSession = Depends(get_db),
):
    season, items = await get_pixel_battle_leaderboard(db=db)

    return PixelBattleLeaderboardResponse(
        season=build_season_response(season),
        items=[
            PixelBattleLeaderboardItemResponse(
                clan=build_pixel_clan_response(item["clan"]),
                placed_count=item["placed_count"],
                controlled_count=item["controlled_count"],
                members_count=item["members_count"],
                rank=item["rank"],
            )
            for item in items
        ],
    )
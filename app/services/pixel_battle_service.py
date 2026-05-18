from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    PixelBattleClan,
    PixelBattleClanMember,
    PixelBattlePixel,
    PixelBattlePixelEvent,
    PixelBattleSeason,
    PixelBattleUserState,
    StudentProfile,
    User,
)


PIXEL_BATTLE_COOLDOWN_SECONDS = 20

PIXEL_BATTLE_ALLOWED_COLORS = {
    "#000000",
    "#ffffff",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#64748b",
}

DEFAULT_PIXEL_BATTLE_CLANS = [
    {
        "emoji": "🐉",
        "name": "Бэкендовые ящеры",
        "description": "Живут в API, знают SQL и иногда шипят на фронтенд.",
    },
    {
        "emoji": "⚡",
        "name": "Фронтенд на реактах",
        "description": "Двигают кнопку на 2 пикселя и называют это важным UI-решением.",
    },
    {
        "emoji": "🎨",
        "name": "Пиксельные дизайнеры",
        "description": "Сделают красиво даже из пустого div.",
    },
    {
        "emoji": "🤖",
        "name": "Нейронные котики",
        "description": "Пишут промпты, спорят с ИИ и иногда получают магию.",
    },
    {
        "emoji": "🛡️",
        "name": "Кибердружина",
        "description": "Защищают проект от багов, ботов и подозрительных форм.",
    },
    {
        "emoji": "🚀",
        "name": "Деплой без ошибок",
        "description": "Мечтают нажать deploy и не открыть логи.",
    },
    {
        "emoji": "🐸",
        "name": "Жабы на Python",
        "description": "Квакают на Django, FastAPI и автоматизацию.",
    },
    {
        "emoji": "🦆",
        "name": "Уточки-дебагеры",
        "description": "Объясняют баг уточке, пока он сам не исчезнет.",
    },
    {
        "emoji": "🐱",
        "name": "Коты-коммитеры",
        "description": "Коммитят ночью и делают вид, что так и было задумано.",
    },
    {
        "emoji": "🧃",
        "name": "Сок винды",
        "description": "Клан тех, кто пережил обновления Windows и не сломался.",
    },
    {
        "emoji": "💾",
        "name": "Сохранились и вышли",
        "description": "Всегда жмут Ctrl+S перед любым рискованным действием.",
    },
    {
        "emoji": "🔥",
        "name": "Горящий дедлайн",
        "description": "Работают быстрее всех, особенно за 5 минут до сдачи.",
    },
    {
        "emoji": "🧠",
        "name": "Без ТЗ норм",
        "description": "Когда непонятно, что делать, но уже красиво.",
    },
    {
        "emoji": "🪲",
        "name": "Баг не баг, а фича",
        "description": "Умеют превращать ошибки в особенности продукта.",
    },
    {
        "emoji": "⚙️",
        "name": "Ctrl Alt Elite",
        "description": "Техническая элита горячих клавиш и быстрых решений.",
    },
    {
        "emoji": "🌚",
        "name": "Тёмная тема",
        "description": "Кодят ночью, любят dark mode и не включают свет.",
    },
    {
        "emoji": "🧩",
        "name": "Пиксельные шаманы",
        "description": "Собирают картину из хаоса, пикселей и терпения.",
    },
]


async def get_student_profile_for_pixel_battle(
    db: AsyncSession,
    user: User,
) -> StudentProfile:
    profile = await db.scalar(
        select(StudentProfile).where(StudentProfile.user_id == user.id)
    )

    if not profile:
        raise ValueError("Профиль студента не найден")

    return profile


async def ensure_default_pixel_battle_clans(db: AsyncSession) -> None:
    values = [
        {
            "emoji": clan_data["emoji"],
            "name": clan_data["name"],
            "description": clan_data["description"],
            "is_default": True,
        }
        for clan_data in DEFAULT_PIXEL_BATTLE_CLANS
    ]

    statement = (
        insert(PixelBattleClan)
        .values(values)
        .on_conflict_do_nothing(
            index_elements=["name"],
        )
    )

    await db.execute(statement)
    await db.commit()

async def get_pixel_battle_clans(db: AsyncSession) -> list[PixelBattleClan]:
    await ensure_default_pixel_battle_clans(db)

    result = await db.execute(
        select(PixelBattleClan).order_by(PixelBattleClan.id.asc())
    )

    return list(result.scalars().all())


async def get_or_create_current_pixel_battle_season(
    db: AsyncSession,
) -> PixelBattleSeason:
    season = await db.scalar(
        select(PixelBattleSeason)
        .where(PixelBattleSeason.status == "active")
        .order_by(PixelBattleSeason.created_at.desc())
        .limit(1)
    )

    if season:
        return season

    now = datetime.now(timezone.utc)

    season = PixelBattleSeason(
        title=f"Pixel Battle — {now.strftime('%m.%Y')}",
        width=200,
        height=120,
        status="active",
        starts_at=now,
    )

    db.add(season)
    await db.commit()
    await db.refresh(season)

    return season


async def get_my_pixel_battle_clan_member(
    db: AsyncSession,
    user: User,
) -> PixelBattleClanMember | None:
    profile = await get_student_profile_for_pixel_battle(db=db, user=user)

    return await db.scalar(
        select(PixelBattleClanMember).where(
            PixelBattleClanMember.student_profile_id == profile.id
        )
    )


async def join_pixel_battle_clan(
    db: AsyncSession,
    user: User,
    clan_id: int,
) -> PixelBattleClanMember:
    await ensure_default_pixel_battle_clans(db)

    profile = await get_student_profile_for_pixel_battle(db=db, user=user)

    existing_member = await db.scalar(
        select(PixelBattleClanMember).where(
            PixelBattleClanMember.student_profile_id == profile.id
        )
    )

    if existing_member:
        raise ValueError("Вы уже выбрали клан. Изменить клан нельзя")

    clan = await db.get(PixelBattleClan, clan_id)

    if not clan:
        raise ValueError("Клан не найден")

    member = PixelBattleClanMember(
        clan_id=clan.id,
        student_profile_id=profile.id,
    )

    db.add(member)
    await db.commit()
    await db.refresh(member)

    return member


async def get_pixel_battle_cooldown_seconds_left(
    db: AsyncSession,
    user: User,
    season: PixelBattleSeason,
) -> int:
    state = await db.scalar(
        select(PixelBattleUserState).where(
            PixelBattleUserState.season_id == season.id,
            PixelBattleUserState.user_id == user.id,
        )
    )

    if not state or not state.last_pixel_at:
        return 0

    now = datetime.now(state.last_pixel_at.tzinfo or timezone.utc)
    diff = now - state.last_pixel_at
    seconds_left = PIXEL_BATTLE_COOLDOWN_SECONDS - int(diff.total_seconds())

    return max(0, seconds_left)


async def get_my_pixel_battle_state(
    db: AsyncSession,
    user: User,
) -> dict:
    await ensure_default_pixel_battle_clans(db)
    season = await get_or_create_current_pixel_battle_season(db)

    member = await get_my_pixel_battle_clan_member(db=db, user=user)

    clan = None
    if member:
        clan = await db.get(PixelBattleClan, member.clan_id)

    cooldown_seconds_left = await get_pixel_battle_cooldown_seconds_left(
        db=db,
        user=user,
        season=season,
    )

    return {
        "clan": clan,
        "cooldown_seconds_left": cooldown_seconds_left,
        "can_place_pixel": cooldown_seconds_left <= 0 and clan is not None,
    }


async def get_pixel_battle_canvas(
    db: AsyncSession,
) -> tuple[PixelBattleSeason, list[PixelBattlePixel]]:
    season = await get_or_create_current_pixel_battle_season(db)

    result = await db.execute(
        select(PixelBattlePixel)
        .where(PixelBattlePixel.season_id == season.id)
        .order_by(PixelBattlePixel.y.asc(), PixelBattlePixel.x.asc())
    )

    return season, list(result.scalars().all())


async def get_pixel_battle_pixel_author_name(
    db: AsyncSession,
    student_profile_id: int,
) -> str | None:
    profile = await db.get(StudentProfile, student_profile_id)

    if not profile:
        return None

    return profile.full_name


async def get_pixel_battle_pixel_response_data(
    db: AsyncSession,
    pixel: PixelBattlePixel,
) -> dict:
    clan = await db.get(PixelBattleClan, pixel.updated_by_clan_id)
    updated_by_name = await get_pixel_battle_pixel_author_name(
        db=db,
        student_profile_id=pixel.updated_by_student_profile_id,
    )

    return {
        "x": pixel.x,
        "y": pixel.y,
        "color": pixel.color,
        "updated_by_user_id": pixel.updated_by_user_id,
        "updated_by_student_profile_id": pixel.updated_by_student_profile_id,
        "updated_by_name": updated_by_name,
        "clan": {
            "id": clan.id,
            "emoji": clan.emoji,
            "name": clan.name,
        },
        "updated_at": pixel.updated_at,
    }


async def validate_pixel_battle_color(color: str) -> str:
    normalized_color = color.lower()

    if normalized_color not in PIXEL_BATTLE_ALLOWED_COLORS:
        raise ValueError("Этот цвет недоступен в палитре Pixel Battle")

    return normalized_color


async def place_pixel_battle_pixel(
    db: AsyncSession,
    user: User,
    x: int,
    y: int,
    color: str,
) -> PixelBattlePixel:
    season = await get_or_create_current_pixel_battle_season(db)

    if season.status != "active":
        raise ValueError("Сейчас нет активного сезона Pixel Battle")

    if x < 0 or x >= season.width or y < 0 or y >= season.height:
        raise ValueError("Координаты пикселя вне поля")

    color = await validate_pixel_battle_color(color)

    profile = await get_student_profile_for_pixel_battle(db=db, user=user)

    member = await db.scalar(
        select(PixelBattleClanMember).where(
            PixelBattleClanMember.student_profile_id == profile.id
        )
    )

    if not member:
        raise ValueError("Сначала выберите клан")

    cooldown_seconds_left = await get_pixel_battle_cooldown_seconds_left(
        db=db,
        user=user,
        season=season,
    )

    if cooldown_seconds_left > 0:
        raise ValueError(
            f"Следующий пиксель можно поставить через {cooldown_seconds_left} сек."
        )

    old_pixel = await db.scalar(
        select(PixelBattlePixel).where(
            PixelBattlePixel.season_id == season.id,
            PixelBattlePixel.x == x,
            PixelBattlePixel.y == y,
        )
    )

    old_color = old_pixel.color if old_pixel else None
    old_clan_id = old_pixel.updated_by_clan_id if old_pixel else None

    if old_pixel:
        old_pixel.color = color
        old_pixel.updated_by_user_id = user.id
        old_pixel.updated_by_student_profile_id = profile.id
        old_pixel.updated_by_clan_id = member.clan_id
        old_pixel.updated_at = func.now()

        pixel = old_pixel
    else:
        pixel = PixelBattlePixel(
            season_id=season.id,
            x=x,
            y=y,
            color=color,
            updated_by_user_id=user.id,
            updated_by_student_profile_id=profile.id,
            updated_by_clan_id=member.clan_id,
        )
        db.add(pixel)

    event = PixelBattlePixelEvent(
        season_id=season.id,
        x=x,
        y=y,
        old_color=old_color,
        new_color=color,
        old_clan_id=old_clan_id,
        new_clan_id=member.clan_id,
        user_id=user.id,
        student_profile_id=profile.id,
    )
    db.add(event)

    insert_state_statement = (
        insert(PixelBattleUserState)
        .values(
            season_id=season.id,
            user_id=user.id,
            last_pixel_at=func.now(),
        )
        .on_conflict_do_update(
            index_elements=["season_id", "user_id"],
            set_={
                "last_pixel_at": func.now(),
            },
        )
    )

    await db.execute(insert_state_statement)

    await db.commit()
    await db.refresh(pixel)

    return pixel


async def get_pixel_battle_leaderboard(
    db: AsyncSession,
) -> tuple[PixelBattleSeason, list[dict]]:
    season = await get_or_create_current_pixel_battle_season(db)
    clans = await get_pixel_battle_clans(db)

    placed_result = await db.execute(
        select(
            PixelBattlePixelEvent.new_clan_id,
            func.count(PixelBattlePixelEvent.id),
        )
        .where(PixelBattlePixelEvent.season_id == season.id)
        .group_by(PixelBattlePixelEvent.new_clan_id)
    )

    controlled_result = await db.execute(
        select(
            PixelBattlePixel.updated_by_clan_id,
            func.count(PixelBattlePixel.id),
        )
        .where(PixelBattlePixel.season_id == season.id)
        .group_by(PixelBattlePixel.updated_by_clan_id)
    )

    members_result = await db.execute(
        select(
            PixelBattleClanMember.clan_id,
            func.count(PixelBattleClanMember.id),
        )
        .group_by(PixelBattleClanMember.clan_id)
    )

    placed_map = {
        clan_id: count
        for clan_id, count in placed_result.all()
    }

    controlled_map = {
        clan_id: count
        for clan_id, count in controlled_result.all()
    }

    members_map = {
        clan_id: count
        for clan_id, count in members_result.all()
    }

    items = []

    for clan in clans:
        items.append(
            {
                "clan": clan,
                "placed_count": int(placed_map.get(clan.id, 0)),
                "controlled_count": int(controlled_map.get(clan.id, 0)),
                "members_count": int(members_map.get(clan.id, 0)),
            }
        )

    items.sort(
        key=lambda item: (
            item["placed_count"],
            item["controlled_count"],
            item["members_count"],
        ),
        reverse=True,
    )

    for index, item in enumerate(items, start=1):
        item["rank"] = index

    return season, items
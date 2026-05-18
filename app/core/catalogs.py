CITIES = [
    "Сочи",
    "Адлер",
    "Москва",
    "Санкт-Петербург",
    "Краснодар",
    "Ростов-на-Дону",
    "Казань",
    "Екатеринбург",
    "Новосибирск",
    "Нижний Новгород",
    "Самара",
    "Уфа",
    "Пермь",
    "Воронеж",
    "Волгоград",
    "Челябинск",
    "Красноярск",
    "Омск",
    "Тюмень",
    "Иркутск",
    "Ставрополь",
    "Пятигорск",
    "Минеральные Воды",
    "Новороссийск",
    "Анапа",
    "Геленджик",
    "Туапсе",
    "Армавир",
    "Майкоп",
    "Симферополь",
    "Севастополь",
]

DIRECTIONS = {
    "programmer": "Программист",
    "designer": "Дизайнер",
    "marketer": "Маркетолог",
}

WORK_FORMATS = {
    "office": "Офис",
    "remote": "Удаленно",
    "hybrid": "Гибрид",
}

EMPLOYMENT_TYPES = {
    "internship": "Стажировка",
    "part_time": "Частичная занятость",
    "full_time": "Полная занятость",
    "project": "Проектная работа",
    "volunteer": "Волонтерский проект",
}

SKILL_GROUPS = {
    "programming": {
        "label": "Программирование",
        "items": [
            "Python",
            "JavaScript",
            "TypeScript",
            "Java",
            "C#",
            "C++",
            "PHP",
            "Go",
            "HTML",
            "CSS",
            "SCSS",
            "React",
            "Vue",
            "Angular",
            "Node.js",
            "Express.js",
            "FastAPI",
            "Django",
            "Flask",
            "Laravel",
            "Spring Boot",
            "ASP.NET",
            "PostgreSQL",
            "MySQL",
            "SQLite",
            "MongoDB",
            "Redis",
            "SQL",
            "Docker",
            "Docker Compose",
            "Git",
            "GitHub",
            "GitLab",
            "REST API",
            "WebSocket",
            "JWT",
            "Linux",
            "Nginx",
            "Alembic",
            "SQLAlchemy",
            "Pydantic",
            "Unit Testing",
            "CI/CD",
            "Tailwind CSS",
            "Bootstrap",
        ],
    },
    "design": {
        "label": "Дизайн",
        "items": [
            "Figma",
            "Adobe Photoshop",
            "Adobe Illustrator",
            "Adobe After Effects",
            "Adobe Premiere Pro",
            "UI Design",
            "UX Design",
            "Web Design",
            "Mobile Design",
            "Product Design",
            "Graphic Design",
            "Brand Design",
            "Typography",
            "Color Theory",
            "Composition",
            "Wireframes",
            "Prototyping",
            "Design Systems",
            "User Flow",
            "Customer Journey Map",
            "Landing Page Design",
            "Adaptive Design",
            "Responsive Design",
            "Icon Design",
            "Logo Design",
            "Presentation Design",
            "Tilda",
            "Readymag",
            "Canva",
            "Blender",
            "Motion Design",
            "UX Research",
            "Usability Testing",
            "HTML/CSS Basics",
        ],
    },
    "marketing": {
        "label": "Маркетинг",
        "items": [
            "SMM",
            "Target Ads",
            "Context Ads",
            "SEO",
            "Email Marketing",
            "Content Marketing",
            "Copywriting",
            "Marketing Analytics",
            "Google Analytics",
            "Яндекс Метрика",
            "VK Ads",
            "Telegram Ads",
            "Яндекс Директ",
            "Google Ads",
            "CRM",
            "A/B Testing",
            "Brand Strategy",
            "Market Research",
            "Competitor Analysis",
            "Customer Development",
            "Lead Generation",
            "Sales Funnel",
            "Landing Page",
            "Performance Marketing",
            "Influencer Marketing",
            "Community Management",
            "PR",
            "Event Marketing",
        ],
    },
    "ai": {
        "label": "Искусственный интеллект",
        "items": [
            "ChatGPT",
            "Prompt Engineering",
            "AI Tools",
            "Midjourney",
            "Stable Diffusion",
            "DALL-E",
            "Claude",
            "Gemini",
            "Copilot",
            "AI для текста",
            "AI для дизайна",
            "AI для аналитики",
            "AI для маркетинга",
            "Автоматизация через AI",
            "Нейросети",
        ],
    },
    "tools": {
        "label": "Инструменты",
        "items": [
            "Excel",
            "Google Sheets",
            "PowerPoint",
            "Google Slides",
            "Notion",
            "Trello",
            "Jira",
            "Miro",
            "Slack",
            "Discord",
            "WordPress",
            "Tilda",
            "Bitrix24",
            "AmoCRM",
            "Google Docs",
        ],
    },
    "soft_skills": {
        "label": "Soft skills",
        "items": [
            "Коммуникация",
            "Командная работа",
            "Ответственность",
            "Критическое мышление",
            "Самоорганизация",
            "Обучаемость",
            "Публичные выступления",
            "Презентации",
            "Работа с клиентами",
            "Тайм-менеджмент",
            "Креативность",
            "Аналитическое мышление",
        ],
    },
}


def get_all_skills() -> list[str]:
    result: list[str] = []

    for group in SKILL_GROUPS.values():
        for skill in group["items"]:
            if skill not in result:
                result.append(skill)

    return result


ALL_SKILLS = get_all_skills()


def normalize_text(value: str) -> str:
    return value.strip()


def validate_city(value: str) -> str:
    value = normalize_text(value)

    if value not in CITIES:
        raise ValueError("Выберите город из списка")

    return value


def validate_direction(value: str) -> str:
    value = normalize_text(value)

    if value not in DIRECTIONS:
        raise ValueError("Выберите направление из списка")

    return value


def validate_work_format(value: str) -> str:
    value = normalize_text(value)

    if value not in WORK_FORMATS:
        raise ValueError("Выберите формат работы из списка")

    return value


def validate_employment_type(value: str) -> str:
    value = normalize_text(value)

    if value not in EMPLOYMENT_TYPES:
        raise ValueError("Выберите тип занятости из списка")

    return value


def parse_skills(value: str | None) -> list[str]:
    if not value:
        return []

    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


def normalize_skills(value: str | None) -> str:
    skills = parse_skills(value)
    unique_skills: list[str] = []

    for skill in skills:
        if skill not in unique_skills:
            unique_skills.append(skill)

    return ", ".join(unique_skills)


def validate_skills(value: str | None) -> str:
    skills = parse_skills(value)

    if not skills:
        raise ValueError("Выберите хотя бы один навык")

    invalid_skills = [
        skill
        for skill in skills
        if skill not in ALL_SKILLS
    ]

    if invalid_skills:
        raise ValueError(
            "Недопустимые навыки: " + ", ".join(invalid_skills)
        )

    return normalize_skills(value)
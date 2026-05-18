from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


FONT_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
FONT_BOLD_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")


DIRECTION_LABELS = {
    "programmer": "Программист",
    "designer": "Дизайнер",
    "marketer": "Маркетолог",
}


def register_fonts() -> tuple[str, str]:
    regular_font = "Helvetica"
    bold_font = "Helvetica-Bold"

    if FONT_PATH.exists():
        pdfmetrics.registerFont(TTFont("DejaVuSans", str(FONT_PATH)))
        regular_font = "DejaVuSans"

    if FONT_BOLD_PATH.exists():
        pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", str(FONT_BOLD_PATH)))
        bold_font = "DejaVuSans-Bold"
    elif FONT_PATH.exists():
        bold_font = regular_font

    return regular_font, bold_font


def safe_text(value) -> str:
    if value is None:
        return "—"

    value = str(value).strip()

    if not value:
        return "—"

    return escape(value).replace("\n", "<br/>")


def raw_text(value) -> str:
    if value is None:
        return "—"

    value = str(value).strip()

    return value if value else "—"


def direction_label(value: str | None) -> str:
    if not value:
        return "—"

    return DIRECTION_LABELS.get(value, value)


def split_skills(value: str | None) -> list[str]:
    if not value:
        return []

    return [
        item.strip()
        for item in str(value).split(",")
        if item.strip()
    ]


def build_styles(font_name: str, bold_font_name: str) -> dict:
    styles = getSampleStyleSheet()

    for style_name in styles.byName:
        styles[style_name].fontName = font_name

    return {
        "title": ParagraphStyle(
            name="ResumeTitle",
            parent=styles["Title"],
            fontName=bold_font_name,
            fontSize=23,
            leading=28,
            textColor=colors.HexColor("#0F172A"),
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            name="ResumeSubtitle",
            parent=styles["Normal"],
            fontName=font_name,
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748B"),
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "section_title": ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontName=bold_font_name,
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1E3A8A"),
            spaceBefore=8,
            spaceAfter=8,
        ),
        "normal": ParagraphStyle(
            name="ResumeNormal",
            parent=styles["Normal"],
            fontName=font_name,
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            name="ResumeSmall",
            parent=styles["Normal"],
            fontName=font_name,
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748B"),
        ),
        "meta_label": ParagraphStyle(
            name="MetaLabel",
            parent=styles["Normal"],
            fontName=font_name,
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#64748B"),
        ),
        "meta_value": ParagraphStyle(
            name="MetaValue",
            parent=styles["Normal"],
            fontName=bold_font_name,
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#0F172A"),
        ),
        "skill": ParagraphStyle(
            name="Skill",
            parent=styles["Normal"],
            fontName=font_name,
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1E3A8A"),
            alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            name="Footer",
            parent=styles["Normal"],
            fontName=font_name,
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#94A3B8"),
            alignment=TA_CENTER,
        ),
    }


def draw_page_frame(canvas, doc):
    width, height = A4

    canvas.saveState()

    canvas.setFillColor(colors.HexColor("#F8FAFC"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)

    canvas.setFillColor(colors.white)
    canvas.roundRect(
        14 * mm,
        12 * mm,
        width - 28 * mm,
        height - 24 * mm,
        10,
        stroke=0,
        fill=1,
    )

    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.6)
    canvas.roundRect(
        14 * mm,
        12 * mm,
        width - 28 * mm,
        height - 24 * mm,
        10,
        stroke=1,
        fill=0,
    )

    canvas.setFillColor(colors.HexColor("#94A3B8"))
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(width / 2, 8 * mm, "Career Hub IT TOP")

    canvas.restoreState()


def section_block(title: str, content: str | None, styles: dict):
    return KeepTogether(
        [
            Paragraph(title, styles["section_title"]),
            Table(
                [[Paragraph(safe_text(content), styles["normal"])]],
                colWidths=[165 * mm],
                style=[
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ],
            ),
            Spacer(1, 8),
        ]
    )


def meta_card(label: str, value: str, styles: dict):
    return [
        Paragraph(safe_text(label), styles["meta_label"]),
        Paragraph(safe_text(value), styles["meta_value"]),
    ]


def build_meta_table(resume, student, styles: dict) -> Table:
    full_name = raw_text(getattr(student, "full_name", None)) if student else "—"
    group_name = raw_text(getattr(student, "group_name", None)) if student else "—"
    city = raw_text(getattr(resume, "city", None))
    direction = direction_label(getattr(resume, "direction", None))

    data = [
        [
            meta_card("Студент", full_name, styles),
            meta_card("Группа", group_name, styles),
        ],
        [
            meta_card("Город", city, styles),
            meta_card("Направление", direction, styles),
        ],
    ]

    table = Table(
        data,
        colWidths=[82 * mm, 82 * mm],
        hAlign="CENTER",
    )

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    return table


def build_skills_table(skills: list[str], styles: dict):
    if not skills:
        return Table(
            [[Paragraph("—", styles["normal"])]],
            colWidths=[165 * mm],
            style=[
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ],
        )

    rows = []
    current_row = []

    for skill in skills:
        current_row.append(Paragraph(safe_text(skill), styles["skill"]))

        if len(current_row) == 3:
            rows.append(current_row)
            current_row = []

    if current_row:
        while len(current_row) < 3:
            current_row.append("")
        rows.append(current_row)

    table = Table(
        rows,
        colWidths=[53 * mm, 53 * mm, 53 * mm],
        hAlign="LEFT",
    )

    table_style = [
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]

    for row_index, row in enumerate(rows):
        for col_index, cell in enumerate(row):
            if cell:
                table_style.extend(
                    [
                        ("BACKGROUND", (col_index, row_index), (col_index, row_index), colors.HexColor("#DBEAFE")),
                        ("BOX", (col_index, row_index), (col_index, row_index), 0.5, colors.HexColor("#BFDBFE")),
                    ]
                )

    table.setStyle(TableStyle(table_style))

    return table


def generate_resume_pdf(resume, student=None) -> bytes:
    buffer = BytesIO()
    font_name, bold_font_name = register_fonts()
    styles = build_styles(font_name=font_name, bold_font_name=bold_font_name)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=24 * mm,
        leftMargin=24 * mm,
        topMargin=24 * mm,
        bottomMargin=20 * mm,
    )

    elements = []

    elements.append(Paragraph(safe_text(resume.title), styles["title"]))

    student_name = raw_text(getattr(student, "full_name", None)) if student else "Студент"
    subtitle = f"{student_name} - резюме Career Hub IT TOP"
    elements.append(Paragraph(safe_text(subtitle), styles["subtitle"]))

    elements.append(build_meta_table(resume=resume, student=student, styles=styles))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Навыки", styles["section_title"]))
    elements.append(build_skills_table(split_skills(getattr(resume, "skills", None)), styles))
    elements.append(Spacer(1, 8))

    elements.append(section_block("О себе", getattr(resume, "about", None), styles))
    elements.append(section_block("Опыт / проекты", getattr(resume, "experience", None), styles))
    elements.append(section_block("Образование", getattr(resume, "education", None), styles))
    elements.append(section_block("Контакты", getattr(resume, "contacts", None), styles))

    doc.build(
        elements,
        onFirstPage=draw_page_frame,
        onLaterPages=draw_page_frame,
    )

    pdf = buffer.getvalue()
    buffer.close()

    return pdf
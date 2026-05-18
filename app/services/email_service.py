import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email_verification_code(to_email: str, code: str) -> None:
    message = EmailMessage()
    message["Subject"] = "Код подтверждения Career Hub IT TOP"
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email

    message.set_content(
        f"Ваш код подтверждения: {code}\n\n"
        "Если вы не запрашивали код, просто проигнорируйте это письмо."
    )

    with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=10) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)
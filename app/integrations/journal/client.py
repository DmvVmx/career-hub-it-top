import httpx

from app.core.config import settings


class JournalAuthError(Exception):
    pass


class JournalClient:
    LOGIN_URL = "https://msapi.top-academy.ru/api/v2/auth/login"
    USER_INFO_URL = "https://msapi.top-academy.ru/api/v2/settings/user-info"

    async def login_and_get_user_info(self, username: str, password: str) -> dict:
        async with httpx.AsyncClient(timeout=20) as client:
            login_response = await client.post(
                self.LOGIN_URL,
                json={
                    "application_key": settings.JOURNAL_APPLICATION_KEY,
                    "id_city": None,
                    "username": username,
                    "password": password,
                },
                headers={
                    "Origin": "https://journal.top-academy.ru",
                    "Referer": "https://journal.top-academy.ru/",
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/plain, */*",
                },
            )

            if login_response.status_code != 200:
                raise JournalAuthError("Неверный логин или пароль от журнала")

            login_data = login_response.json()
            access_token = login_data.get("access_token")

            if not access_token:
                raise JournalAuthError("Журнал не вернул access token")

            user_info_response = await client.get(
                self.USER_INFO_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Origin": "https://journal.top-academy.ru",
                    "Referer": "https://journal.top-academy.ru/",
                    "Accept": "application/json, text/plain, */*",
                },
            )

            if user_info_response.status_code != 200:
                raise JournalAuthError("Не удалось получить данные студента")

            return user_info_response.json()
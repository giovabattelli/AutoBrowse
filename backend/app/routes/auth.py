from fastapi import APIRouter, Request
from datetime import datetime, timezone
from typing import Optional
import requests

from app.database import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

router = APIRouter()


@router.get("/login/google")
async def login_google(ext: Optional[str] = None):
    url = (
        "https://accounts.google.com/o/oauth2/auth"
        f"?response_type=code"
        f"&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri=https://{ext}.chromiumapp.org/"
        "&scope=openid%20profile%20email"
        "&access_type=offline"
    )
    return {"url": url}


@router.get("/auth/google")
async def auth_google(request: Request, code: str, ext: Optional[str] = None):
    token_url = "https://accounts.google.com/o/oauth2/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": f"https://{ext}.chromiumapp.org/",
        "grant_type": "authorization_code",
    }

    token_resp = requests.post(token_url, data=data)
    token_resp.raise_for_status()
    access_token = token_resp.json().get("access_token")

    user_resp = requests.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    user_resp.raise_for_status()
    user_info = user_resp.json()

    users_col = request.app.state.users_col
    profiles_col = request.app.state.profiles_col

    if email := user_info.get("email"):
        users_existing = users_col.find_one({"email": email})
        users_profiles_existing = profiles_col.find_one({"email": email})
        now = datetime.now(timezone.utc)

        if not users_existing:
            users_col.insert_one(
                {
                    "name": user_info.get("name"),
                    "email": email,
                    "premium": 0,
                    "createdAt": now,
                    "updatedAt": now,
                }
            )

        if not users_profiles_existing:
            profiles_col.insert_one(
                {
                    "email": email,
                    "profileFirstName": user_info.get("name"),
                    "profileMiddle": "",
                    "profileLastName": "",
                    "profileEmail": email,
                    "profileAboutMe": "",
                    "lastUpdated": now,
                }
            )

    return user_info

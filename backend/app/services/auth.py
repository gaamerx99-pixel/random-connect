import os
from urllib.parse import urlencode
import httpx
from jose import jwt
from datetime import datetime, timedelta

class AuthService:
    @staticmethod
    def get_google_oauth_url() -> str:
        params = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "redirect_uri": os.getenv("GOOGLE_OAUTH_REDIRECT_URI"),
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    @staticmethod
    def verify_google_callback(code: str) -> dict:
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": os.getenv("GOOGLE_OAUTH_REDIRECT_URI"),
            "grant_type": "authorization_code",
        }
        response = httpx.post(token_url, data=data)
        response.raise_for_status()
        token_data = response.json()
        return token_data

    @staticmethod
    def create_access_token(subject: str) -> str:
        expires_delta = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
        expire = datetime.utcnow() + expires_delta
        to_encode = {"sub": subject, "exp": expire}
        return jwt.encode(to_encode, os.getenv("SECRET_KEY", "secret"), algorithm=os.getenv("JWT_ALGORITHM", "HS256"))

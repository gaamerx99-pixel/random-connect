from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from app.services.auth import AuthService

router = APIRouter()

@router.get("/google/login")
def google_login():
    return RedirectResponse(url=AuthService.get_google_oauth_url())

@router.get("/google/callback")
def google_callback(code: str | None = None):
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code")
    token_data = AuthService.verify_google_callback(code)
    return token_data

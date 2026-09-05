from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from jose import jwt, JWTError
import httpx

from app.config import CLERK_PEM_PUBLIC_KEY, CLERK_SECRET_KEY, JWT_ALGORITHM, ENVIRONMENT

CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"
_cached_jwks: Optional[dict] = None


async def get_clerk_jwks():
    global _cached_jwks
    if _cached_jwks:
        return _cached_jwks
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(CLERK_JWKS_URL, timeout=5.0)
            if resp.status_code == 200:
                _cached_jwks = resp.json()
                return _cached_jwks
    except Exception as e:
        print(f"[Auth Error] Failed to fetch JWKS: {e}")
    return None


async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> dict:
    """FastAPI dependency to verify Clerk JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )

    token = authorization.split(" ")[1]
    return await verify_clerk_token_string(token)


async def verify_clerk_token_string(token: str) -> dict:
    """Verify a raw Clerk JWT string."""

    # Support development / guest mode tokens when not in production
    if ENVIRONMENT != "production" and (
        token in ("mock-dev-token", "guest-token")
        or token.startswith("mock-")
        or token.startswith("guest_")
    ):
        return {
            "sub": "guest_user",
            "email": "guest@randomconnect.app",
            "name": "Rahul (Guest User)",
        }

    # Verify signature if key is present or fetch JWKS, else unverified decode in dev
    try:
        if CLERK_PEM_PUBLIC_KEY:
            payload = jwt.decode(token, CLERK_PEM_PUBLIC_KEY, algorithms=[JWT_ALGORITHM])
        else:
            # Unverified decode for development mode when keys are not populated
            payload = jwt.decode(token, "", options={"verify_signature": False})

        sub = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub/clerk_id",
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT verification failed: {str(e)}",
        )

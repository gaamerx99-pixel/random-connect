from fastapi import APIRouter

from .auth import router as auth_router
from .signaling import router as signaling_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(signaling_router, tags=["Signaling"])
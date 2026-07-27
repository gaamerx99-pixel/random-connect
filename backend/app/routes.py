from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.signaling import router as signaling_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(signaling_router, prefix="/signaling", tags=["signaling"])

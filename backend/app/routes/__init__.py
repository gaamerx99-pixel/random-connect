from fastapi import APIRouter

from .auth import router as auth_router
from .signaling import router as signaling_router
from .users import router as users_router
from .admin import router as admin_router


api_router = APIRouter()


api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"],
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["Users"],
)

api_router.include_router(
    signaling_router,
    tags=["Signaling"],
)

api_router.include_router(
    admin_router,
    prefix="/admin",
    tags=["Admin"],
)
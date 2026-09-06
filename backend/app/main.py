from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api_router, signaling
from app.db import init_indexes
from app.config import CORS_ORIGINS

app = FastAPI(title="RandomConnect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_indexes()


app.include_router(api_router, prefix="/api/v1")
app.include_router(signaling.router, prefix="/api/v1/signaling", tags=["Signaling"])

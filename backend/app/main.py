from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api_router, signaling

app = FastAPI(title="RandomConnect API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(signaling.router, prefix="/api/v1/signaling", tags=["Signaling"])

import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI

client = AsyncIOMotorClient(MONGO_URI)
db = client.randomconnect

users_collection = db.users
matches_collection = db.matches
reports_collection = db.reports
blocks_collection = db.blocks
friends_collection = db.friends


async def init_indexes():
    """Create indexes for faster matchmaking and queries."""
    try:
        await users_collection.create_index("clerk_id", unique=True)
        await users_collection.create_index("gender")
        await users_collection.create_index("is_online")
        await reports_collection.create_index("reporter_clerk_id")
    except Exception as e:
        print(f"[DB Index Warning]: {e}")

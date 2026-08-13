from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI
import certifi


# MongoDB Atlas connection
client = AsyncIOMotorClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
)

db = client.randomconnect

users_collection = db.users
matches_collection = db.matches
reports_collection = db.reports
blocks_collection = db.blocks
friends_collection = db.friends


async def init_indexes():
    """Create indexes for faster matchmaking and queries."""
    try:
        await users_collection.create_index(
            "clerk_id",
            unique=True,
        )

        await users_collection.create_index(
            "gender"
        )

        await users_collection.create_index(
            "is_online"
        )

        await reports_collection.create_index(
            "reporter_clerk_id"
        )

        print("[DB] MongoDB indexes ready.")

    except Exception as e:
        print(f"[DB Index Warning]: {e}")
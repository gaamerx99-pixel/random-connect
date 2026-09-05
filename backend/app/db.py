from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI
import certifi
from pymongo import ASCENDING


# MongoDB Atlas connection
client = AsyncIOMotorClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=2500,
    connectTimeoutMS=2500,
    socketTimeoutMS=5000,
)

db = client.randomconnect

users_collection = db.users
matches_collection = db.matches
reports_collection = db.reports
blocks_collection = db.blocks
friends_collection = db.friends
rewarded_ads_collection = db.rewarded_ads
reward_logs_collection = db.reward_logs


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

        await users_collection.create_index(
            [
                ("gender", ASCENDING),
                ("looking_for", ASCENDING),
                ("female_match_credits", ASCENDING),
            ]
        )

        await rewarded_ads_collection.create_index(
            [
                ("provider", ASCENDING),
                ("reward_event_id", ASCENDING),
            ],
            unique=True,
        )

        await rewarded_ads_collection.create_index(
            "clerk_id"
        )

        await reward_logs_collection.create_index(
            "status"
        )

        await reward_logs_collection.create_index(
            [
                ("clerk_id", ASCENDING),
                ("created_at", ASCENDING),
            ]
        )

        print("[DB] MongoDB indexes ready.")

    except Exception as e:
        print(f"[DB Index Warning]: {e}")

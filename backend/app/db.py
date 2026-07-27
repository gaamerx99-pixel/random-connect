import os
from motor.motor_asyncio import AsyncIOMotorClient

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/randomconnect")
client = AsyncIOMotorClient(mongo_uri)
db = client.randomconnect

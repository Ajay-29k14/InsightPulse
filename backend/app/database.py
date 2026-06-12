from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings
import asyncio

settings = get_settings()

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.db_name]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.assessments.create_index("user_id")
    await db.chat_messages.create_index("user_id")
    await db.chat_messages.create_index([("user_id", 1), ("created_at", -1)])
    print(f"Connected to MongoDB: {settings.db_name}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return db

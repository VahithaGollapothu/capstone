import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("archgen")

db_client = None
db = None

# Thread-safe local in-memory database fallback if MongoDB is not reachable
in_memory_db = {
    "projects": []
}

async def init_db():
    global db_client, db
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
        db_client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Verify connection
        await db_client.server_info()
        db = db_client.get_database()
        logger.info("Successfully connected to MongoDB!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}. Falling back to In-Memory DB mode.")
        db_client = None
        db = None

async def get_db():
    return db

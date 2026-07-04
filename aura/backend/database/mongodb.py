"""
Database Management Module.
This module provides a singleton connection manager for MongoDB using Motor (async driver).
It allows all other modules (like agents and API routes) to share a single async DB connection pool.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings

class DatabaseManager:
    """
    Manages the lifecycle of the MongoDB connection.
    Exposes `connect()` to be called at application startup,
    and `get_db()` to be used across the app to access collections.
    """
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        """Initializes the MongoDB async client and selects the target database."""
        if settings.MONGO_URI:
            try:
                # Initialize the Motor client pointing to our Mongo URI
                cls.client = AsyncIOMotorClient(settings.MONGO_URI)
                cls.db = cls.client.get_database("aura_db")
                print("✅ [CORE] Connected to MongoDB")
            except Exception as e:
                print(f"❌ [CORE] MongoDB Error: {e}")
        else:
            print("❌ [CORE] Missing MONGO_URI")

    @classmethod
    def get_db(cls):
        """Returns the active database instance for executing queries."""
        return cls.db

# Global singleton instance for database access
db_manager = DatabaseManager()

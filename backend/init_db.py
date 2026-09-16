import asyncio
from app.core.database import engine
from app.models.domain import Base

async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("TABLES_READY")

if __name__ == "__main__":
    asyncio.run(init_tables())
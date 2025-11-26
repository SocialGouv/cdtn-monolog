import asyncpg
import os
from dotenv import load_dotenv
import pgsql


load_dotenv()
      
class MatomoSQLConnector:
    def __init__(self):
        self.user = os.getenv('PG_MATOMO_USER')
        self.password = os.getenv('PG_MATOMO_PASSWORD')
        self.host = os.getenv('PG_MATOMO_HOST')
        self.database = os.getenv('PG_MATOMO_DB')
        self.port = os.getenv('PG_MATOMO_PORT')

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            user=self.user,
            password=self.password,
            database=self.database,
            host=self.host,
            port=self.port
        )

    async def run_query(self, query):
        async with self.pool.acquire() as conn:
            result = await conn.fetch(query)
            return result

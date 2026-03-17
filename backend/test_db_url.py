import os
import dj_database_url
from dotenv import load_dotenv

load_dotenv(override=True)
db_url = os.environ.get('DATABASE_URL')
config = dj_database_url.config(default=db_url)

print(f"URL: {db_url}")
print(f"Config: {config}")

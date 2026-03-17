import os
from dotenv import load_dotenv

load_dotenv()
print(f"DATABASE_URL starts with: {os.environ.get('DATABASE_URL')[:30]}...")
print(f"USE_LOCAL_SQLITE: {os.environ.get('USE_LOCAL_SQLITE')}")

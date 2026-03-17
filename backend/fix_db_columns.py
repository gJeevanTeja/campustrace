import os
import django
import sys
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

with connection.cursor() as cursor:
    try:
        print("Attempting to rename 'items_returned_count' to 'successful_returns'...")
        cursor.execute("ALTER TABLE users RENAME COLUMN items_returned_count TO successful_returns")
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
        print("Checking if 'successful_returns' already exists...")
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'successful_returns'")
        if cursor.fetchone():
            print("'successful_returns' already exists.")
        else:
            print("'successful_returns' does not exist and rename failed.")

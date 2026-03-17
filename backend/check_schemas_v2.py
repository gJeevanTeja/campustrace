import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_schemas():
    for table in ['users', 'notifications', 'reward_logs']:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table}'")
            rows = cursor.fetchall()
            print(f"\n--- Schema for {table} ---")
            for row in rows:
                print(row)

if __name__ == "__main__":
    check_schemas()

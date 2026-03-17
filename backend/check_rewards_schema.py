import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_rewards_schema():
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'reward_transactions'")
        rows = cursor.fetchall()
        print("Schema for reward_transactions:")
        for row in rows:
            print(row)

if __name__ == "__main__":
    check_rewards_schema()

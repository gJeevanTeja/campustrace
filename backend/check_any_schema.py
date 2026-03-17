import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_table_schema(table_name):
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table_name}'")
        rows = cursor.fetchall()
        print(f"Schema for {table_name}:")
        for row in rows:
            print(row)

if __name__ == "__main__":
    check_table_schema('reward_logs')

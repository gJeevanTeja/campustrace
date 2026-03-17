import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def check_schemas():
    output = []
    for table in ['users', 'notifications', 'reward_logs']:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table}'")
            rows = cursor.fetchall()
            output.append(f"\n--- Schema for {table} ---")
            for row in rows:
                output.append(str(row))
    
    with open('schemas_utf8.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join(output))
    print("Done. Wrote to schemas_utf8.txt")

if __name__ == "__main__":
    check_schemas()

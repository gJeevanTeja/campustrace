import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def execute_sql(sql):
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql)
            print(f"Executed: {sql}")
        except Exception as e:
            print(f"Error executing SQL: {e}")

def fix_items_integrity():
    print("--- Fixing Items Integrity Issues ---")
    
    # 1. Drop legacy column manual_location if it exists
    execute_sql("ALTER TABLE items DROP COLUMN IF EXISTS manual_location;")
    
    # 2. Make use_current_location nullable or add default
    execute_sql("ALTER TABLE items ALTER COLUMN use_current_location DROP NOT NULL;")
    execute_sql("ALTER TABLE items ALTER COLUMN use_current_location SET DEFAULT FALSE;")
    
    # 3. Check for any other problematic NOT NULL columns without defaults
    # For example, block_name (if it was created NOT NULL earlier)
    # According to our check, it is already YES nullable.
    
    # Actually, let's just make ALL extra columns nullable for safety
    extra_cols = ['block_name', 'brand', 'color', 'unique_mark']
    for col in extra_cols:
        execute_sql(f"ALTER TABLE items ALTER COLUMN {col} DROP NOT NULL;")

    print("Fix applied.")

if __name__ == "__main__":
    fix_items_integrity()

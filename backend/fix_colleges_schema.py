import os
import django
import sys
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def run_sql(sql):
    with connection.cursor() as cursor:
        try:
            print(f"Running: {sql}")
            cursor.execute(sql)
            print("SUCCESS!")
        except Exception as e:
            print(f"FAILED: {e}")

print("--- Fixing 'colleges' table schema ---")

# 1. email_domain
run_sql("ALTER TABLE colleges RENAME COLUMN domain TO email_domain")

# 2. Ensure is_active exists (sometimes migrations say it does but DB doesn't)
# We use a trick to add it only if it's missing
run_sql("""
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colleges' AND column_name='is_active') THEN
        ALTER TABLE colleges ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
""")

print("\n--- Current Schema Check ---")
with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='colleges'")
    print(f"Final columns: {[row[0] for row in cursor.fetchall()]}")

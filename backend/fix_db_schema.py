import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def execute_sql(sql):
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql)
            print(f"Executed: {sql[:70]}...")
        except Exception as e:
            print(f"Error executing SQL: {e}")

def table_exists(table_name):
    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name='{table_name}'")
            return cursor.fetchone()[0] > 0
        else:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
            return len(cursor.fetchall()) > 0

def add_column_if_missing(table_name, column_name, column_def):
    with connection.cursor() as cursor:
        try:
            if connection.vendor == 'postgresql':
                cursor.execute(f"""
                    SELECT COUNT(*)
                    FROM information_schema.columns 
                    WHERE table_name='{table_name}' AND column_name='{column_name}';
                """)
            else: # sqlite
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = [col[1] for col in cursor.fetchall()]
                if column_name in columns: return
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def};")
                print(f"Added column {column_name} to {table_name}")
                return

            if cursor.fetchone()[0] == 0:
                print(f"Adding column {column_name} to {table_name}...")
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def};")
                print("Done.")
        except Exception as e:
            print(f"Error adding {column_name} to {table_name}: {e}")

def fix():
    json_type = 'JSONB' if connection.vendor == 'postgresql' else 'TEXT'
    timestamp_type = 'TIMESTAMP WITH TIME ZONE' if connection.vendor == 'postgresql' else 'DATETIME'

    # 1. Users
    print("--- Users ---")
    add_column_if_missing('users', 'last_active', f'{timestamp_type} DEFAULT CURRENT_TIMESTAMP')
    add_column_if_missing('users', 'is_blocked', 'BOOLEAN DEFAULT FALSE')
    add_column_if_missing('users', 'is_verified', 'BOOLEAN DEFAULT FALSE')
    add_column_if_missing('users', 'reward_points', 'INTEGER DEFAULT 0')
    add_column_if_missing('users', 'level', 'VARCHAR(50) DEFAULT \'Beginner Helper\'')
    add_column_if_missing('users', 'successful_returns', 'INTEGER DEFAULT 0')
    add_column_if_missing('users', 'badges', f"{json_type} DEFAULT '[]'")

    # 2. Items
    print("--- Items ---")
    add_column_if_missing('items', 'brand', 'VARCHAR(100)')
    add_column_if_missing('items', 'color', 'VARCHAR(50)')
    add_column_if_missing('items', 'unique_mark', 'TEXT')
    add_column_if_missing('items', 'location_detail', 'VARCHAR(200)')
    add_column_if_missing('items', 'location_name', 'VARCHAR(300)')
    add_column_if_missing('items', 'use_current_location', 'BOOLEAN DEFAULT FALSE')
    add_column_if_missing('items', 'verification_questions', f'{json_type}')
    add_column_if_missing('items', 'verification_answers', f'{json_type}')
    add_column_if_missing('items', 'contact_phone', 'VARCHAR(20)')
    add_column_if_missing('items', 'claim_code', 'VARCHAR(6)')
    add_column_if_missing('items', 'incident_datetime', f'{timestamp_type}')
    add_column_if_missing('items', 'college_id', 'INTEGER REFERENCES colleges(id) ON DELETE CASCADE')
    add_column_if_missing('items', 'category_new_id', 'INTEGER REFERENCES categories(id) ON DELETE SET NULL')
    add_column_if_missing('items', 'block_id', 'INTEGER REFERENCES colleges_campuslocation(id) ON DELETE SET NULL')

    # 3. Claim Sessions
    print("--- Claim Sessions ---")
    if table_exists('claim_sessions'):
        add_column_if_missing('claim_sessions', 'ai_score', 'INTEGER DEFAULT 0')
        add_column_if_missing('claim_sessions', 'ai_result_label', 'VARCHAR(50)')
        add_column_if_missing('claim_sessions', 'ai_result', 'VARCHAR(50) DEFAULT \'PENDING\'')
        add_column_if_missing('claim_sessions', 'current_question_index', 'INTEGER DEFAULT 0')
        add_column_if_missing('claim_sessions', 'ai_questions', f'{json_type} DEFAULT \'[]\'')
        add_column_if_missing('claim_sessions', 'user_answers', f'{json_type} DEFAULT \'{{}}\'')
        add_column_if_missing('claim_sessions', 'claim_code', 'VARCHAR(6)')
        add_column_if_missing('claim_sessions', 'attempts', 'INTEGER DEFAULT 0')
        add_column_if_missing('claim_sessions', 'approver_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL')

if __name__ == "__main__":
    fix()
    print("Done")

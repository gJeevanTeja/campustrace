import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unitrace.settings')
django.setup()

def audit():
    with connection.cursor() as cursor:
        # Get columns for 'users' table in PostgreSQL
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        """)
        columns = {row[0]: row[1] for row in cursor.fetchall()}
        
        expected_fields = [
            'reward_points', 'level', 'successful_returns', 'badges', 'trust_score',
            'auth_provider', 'google_id', 'google_picture', 'dark_mode',
            'notifications_enabled', 'notification_sound', 'email_notifications',
            'last_known_lat', 'last_known_lng', 'college_id', 'is_blocked', 'is_verified'
        ]

        print("--- PostgreSQL 'users' Table Schema Audit ---")
        missing = []
        for f in expected_fields:
            if f in columns:
                print(f"[OK] {f} ({columns[f]})")
            else:
                print(f"[MISSING] {f}")
                missing.append(f)
        
        print(f"\nTotal Missing Fields: {len(missing)}")
        
        # Also print all columns found
        print("\n--- All Columns Found in PostgreSQL ---")
        for col, dtype in columns.items():
            print(f"- {col}: {dtype}")

if __name__ == "__main__":
    audit()

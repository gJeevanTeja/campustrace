import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

def fix_claims():
    columns_to_drop = [
        "questions",
        "answers",
        "ai_evaluation",
        "score",
        "score_details",
        "current_q"
    ]
    
    with connection.cursor() as cursor:
        print("Checking for legacy columns in claim_sessions...")
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'claim_sessions'")
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        for col in columns_to_drop:
            if col in existing_columns:
                print(f"Dropping col: {col}")
                cursor.execute(f'ALTER TABLE claim_sessions DROP COLUMN "{col}"')
            else:
                print(f"Col {col} not found, skipping.")
                
    print("Claim integrity fix complete.")

if __name__ == "__main__":
    fix_claims()

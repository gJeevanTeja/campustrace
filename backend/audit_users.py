import sqlite3

db_path = r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\backend\db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all column names
cursor.execute("PRAGMA table_info(users);")
columns = [row[1] for row in cursor.fetchall()]

# Fields we expect from models
expected_fields = [
    'reward_points', 'level', 'successful_returns', 'badges', 'trust_score',
    'auth_provider', 'google_id', 'google_picture', 'dark_mode',
    'notifications_enabled', 'notification_sound', 'email_notifications',
    'last_known_lat', 'last_known_lng', 'college_id', 'is_blocked', 'is_verified'
]

print("--- Data Schema Audit ---")
missing = []
for f in expected_fields:
    if f in columns:
        print(f"[OK] {f}")
    else:
        print(f"[MISSING] {f}")
        missing.append(f)

print(f"\nTotal Missing Fields: {len(missing)}")

# Check migrations
print("\n--- Migration Table ---")
cursor.execute("SELECT name FROM django_migrations WHERE app='users' ORDER BY name;")
applied = [row[0] for row in cursor.fetchall()]
for m in applied:
    print(f"[APPLIED] {m}")

conn.close()

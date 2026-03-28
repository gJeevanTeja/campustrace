import sqlite3
import os

db_path = r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\backend\db.sqlite3'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- All Columns in Table: users ---")
cursor.execute("PRAGMA table_info(users);")
for row in cursor.fetchall():
    print(f"Col: {row[1]}, Type: {row[2]}, NotNull: {row[3]}, PK: {row[5]}")

print("\n--- All Applied Migrations for 'users' app ---")
cursor.execute("SELECT name, applied FROM django_migrations WHERE app='users' ORDER BY applied ASC;")
for row in cursor.fetchall():
    print(row)

conn.close()

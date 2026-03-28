import os
import django
import sys

# Set up Django environment
sys.path.append('c:/Users/JEEVAN TEJA/Desktop/campustrace-main/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.db import connection
from users.models import User

try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        row = cursor.fetchone()
        print(f"Database connection successful: SELECT 1 returned {row}")
    
    user_count = User.objects.count()
    print(f"User count: {user_count}")
    
except Exception as e:
    print(f"Database connection failed: {e}")
    import traceback
    traceback.print_exc()

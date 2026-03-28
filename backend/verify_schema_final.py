import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unitrace.settings')
django.setup()

User = get_user_model()

def verify():
    print("--- Verifying User Model Access ---")
    try:
        user = User.objects.first()
        if not user:
            print("No users found in database, creating a test user...")
            user = User.objects.create_user(email="test@example.com", name="Test User", password="password123")
        
        fields_to_check = [
            'reward_points', 'level', 'successful_returns', 'badges', 'trust_score'
        ]
        
        for f in fields_to_check:
            val = getattr(user, f)
            print(f"[OK] {f}: {val}")
            
        print("\nVerification Successful: All fields are accessible.")
    except Exception as e:
        print(f"\nVerification Failed: {str(e)}")

if __name__ == "__main__":
    verify()

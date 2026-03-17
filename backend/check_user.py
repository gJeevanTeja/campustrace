import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from users.models import User

email = "2311cs030131@mallareddyuniversity.ac.in"
try:
    user = User.objects.get(email=email)
    print(f"User found: {user.email}")
    print(f"Is active: {user.is_active}")
    print(f"Is blocked: {user.is_blocked}")
    print(f"Role: {user.role}")
    print(f"Has usable password: {user.has_usable_password()}")
except User.DoesNotExist:
    print(f"User NOT found: {email}")
    # List a few users to see what's in there
    print("\nExisting users:")
    for u in User.objects.all()[:10]:
        print(f"- {u.email}")

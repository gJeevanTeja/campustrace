import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from colleges.models import College

User = get_user_model()

# Ensure at least one college exists
college, created = College.objects.get_or_create(
    name="Malla Reddy University",
    defaults={"email_domain": "mallareddyuniversity.ac.in", "is_active": True}
)

email = "2311cs030131@mallareddyuniversity.ac.in"
password = "Shivani@131"

user = User.objects.filter(email=email).first()
if not user:
    user = User.objects.create_user(
        email=email,
        password=password,
        name="Sreeja",
        college=college
    )
    print(f"Created user: {email}")
else:
    user.set_password(password)
    user.college = college
    user.save()
    print(f"Updated user: {email}")

print("Verification complete.")

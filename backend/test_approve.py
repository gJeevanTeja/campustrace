import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campustrace_backend.settings")
django.setup()

from administration.models import AdminRequest
from users.models import User
from colleges.models import College

try:
    req = AdminRequest.objects.get(id=1)
    print("Testing with request:", req.email)
    
    college, _ = College.objects.get_or_create(
        name=req.college_name,
        defaults={'email_domain': req.email.split('@')[-1]}
    )
    
    user, created = User.objects.get_or_create(
        email=req.email,
        defaults={
            'name': req.full_name,
            'phone': req.phone_number,
            'role': 'college_admin',
            'college': college,
            'is_active': True,
            'is_verified': True
        }
    )
    print("User created:", created)
    
    if created:
        password = User.objects.make_random_password()
        user.set_password(password)
    else:
        user.role = 'college_admin'
        user.college = college
        user.is_active = True
        
    user.save()
    print("User saved successfully")
    
except Exception as e:
    import traceback
    traceback.print_exc()

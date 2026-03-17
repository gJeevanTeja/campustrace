import requests
from django.conf import settings
import os
import django

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def test():
    sa = User.objects.get(id=13)
    ca = User.objects.filter(role='college_admin').first()
    
    sat = str(RefreshToken.for_user(sa).access_token)
    cat = str(RefreshToken.for_user(ca).access_token)
    
    url = "http://localhost:8001/api/admin/blocks/"
    
    print("Testing SA...")
    r_sa = requests.post(url, data={"name":"TestSA", "latitude":1, "longitude":1, "active": "true"}, headers={"Authorization": f"Bearer {sat}"})
    print(f"SA status: {r_sa.status_code}")
    if r_sa.status_code != 201:
        print(f"SA response: {r_sa.json()}")
        
    print("\nTesting CA...")
    r_ca = requests.post(url, data={"name":"TestCA", "latitude":2, "longitude":2, "active": "true"}, headers={"Authorization": f"Bearer {cat}"})
    print(f"CA status: {r_ca.status_code}")
    if r_ca.status_code != 201:
        print(f"CA response: {r_ca.json()}")

if __name__ == "__main__":
    test()

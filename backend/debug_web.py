import requests
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campustrace_backend.settings')
django.setup()

from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def test_api():
    print("Generating token...")
    u = User.objects.filter(role='super_admin').first() or User.objects.first()
    if not u:
        print("No user found")
        return
    
    refresh = RefreshToken.for_user(u)
    token = str(refresh.access_token)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    urls = [
        "http://localhost:8001/api/notifications/",
        "http://localhost:8001/api/items/?status=returned",
        "http://localhost:8001/api/auth/profile/"
    ]
    
    for url in urls:
        print(f"\nTesting URL: {url}")
        try:
            resp = requests.get(url, headers=headers)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 500:
                print("--- Error Response ---")
                # print first 500 chars
                print(resp.text[:500])
            else:
                print("Success!")
                data = resp.json()
                if isinstance(data, dict):
                     # check for college data
                     if 'college_data' in data:
                         print(f"college_data present: {data['college_data']}")
                     elif 'college' in data:
                         print(f"OLD college field present: {data['college']}")
                     else:
                         print("No college fields found in response.")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()

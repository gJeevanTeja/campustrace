import requests
import json

url = "http://localhost:8000/api/auth/login/"
# Now testing with the user I just created
payload = {
    "email": "2311cs030131@mallareddyuniversity.ac.in",
    "password": "password123"
}

print(f"Testing login at {url}")
try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response JSON: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"Error: {e}")

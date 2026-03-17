import requests
import json

url = "http://localhost:8001/api/auth/login/"
payload = {
    "email": "2311cs030131@mallareddyuniversity.ac.in",
    "password": "some_password"
}

print(f"Testing login at {url}")
try:
    response = requests.post(url, json=payload, timeout=5)
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
    except:
        print(f"Response Text (first 500 chars): {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

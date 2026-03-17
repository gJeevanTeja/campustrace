import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_test():
    # Login as an admin or test user if available, or just create a user
    # Trying common user credentials 
    # Or just use the standard endpoints if they allow anonymous or if we can register
    
    # We will try to register a temporary user to get an auth token
    register_res = requests.post(f"{BASE_URL}/auth/register/", json={
        "username": "test_crash_user",
        "email": "test@test.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "college": 1 # Assume college ID 1 exists
    })
    
    login_res = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "test_crash_user",
        "password": "password123"
    })
    
    token = None
    if login_res.status_code == 200:
        token = login_res.json().get('access')
    else:
        # If registration failed (e.g. user exists), just login
        print("Login fallback...")
        login_res = requests.post(f"{BASE_URL}/auth/login/", json={
            "username": "admin", # usually exists in django templates
            "password": "admin"
        })
        if login_res.status_code == 200:
            token = login_res.json().get('access')

    if not token:
        print("Failed to get token!")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "title": "Id card",
        "description": "i have lost my id card",
        "category_new": 1, # ID card type
        "type": "lost",
        "block": 1,
        "location": "other",
        "incident_datetime": "2026-03-12T10:00:00.000Z"
    }

    res = requests.post(f"{BASE_URL}/items/", json=payload, headers=headers)
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)

if __name__ == "__main__":
    run_test()

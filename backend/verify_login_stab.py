import requests
import json

BASE_URL = "http://localhost:8001/api/auth" # Runserver port

def test_login_failure():
    print("\n--- Testing Login Failure ---")
    payload = {
        "email": "nonexistent@mallareddyuniversity.ac.in",
        "password": "wrongpassword"
    }
    r = requests.post(f"{BASE_URL}/login/", json=payload)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid email or password"

def test_login_success():
    print("\n--- Testing Login Success ---")
    payload = {
        "email": "2311cs030131@mallareddyuniversity.ac.in",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/login/", json=payload)
    print(f"Status: {r.status_code}")
    data = r.json()
    print(f"Response success: {data.get('success')}")
    print(f"Token present: {'token' in data}")
    print(f"User present: {'user' in data}")
    assert r.status_code == 200
    assert data["success"] is True
    assert "token" in data
    assert "user" in data

def test_domain_validation():
    print("\n--- Testing Domain Validation ---")
    payload = {
        "email": "user@gmail.com",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/login/", json=payload)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
    # Domain validation might return 400 or 401 depending on how we handle it.
    # The requirement said "Invalid email or password" for general errors, 
    # but specific domain rules often have their own message.
    # Let's see what it returns.

if __name__ == "__main__":
    try:
        test_login_failure()
        test_login_success()
        test_domain_validation()
    except Exception as e:
        print(f"FAILED: {e}")

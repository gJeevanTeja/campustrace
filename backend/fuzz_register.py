import requests
import json

base_data = {
    "name": "Gunatit",
    "username": "gunatit178_test",
    "email": "gunatit_test@mru.edu.in",
    "phone": "+918877665544",
    "department": "Data Science",
    "section": "",
    "college_year": "3rd Year",
    "college_name": "",
    "password": "Password@123",
    "confirm_password": "Password@123",
    "terms_accepted": True,
    "roll_number": "1234",
    "gender": "Male",
    "student_id": "1234"
}

url = "http://localhost:8000/api/auth/register/"

# Test 1: exact payload
res = requests.post(url, json=base_data)
if res.status_code == 500:
    print("Found 500 on exact payload!")
    print(res.text)

# Test 2: variations
for key in base_data.keys():
    data = base_data.copy()
    data.pop(key) # Try missing key
    res = requests.post(url, json=data)
    if res.status_code == 500:
        print(f"Found 500 on missing {key}!")
        print(res.text)

for key in base_data.keys():
    data = base_data.copy()
    data[key] = "" # Try empty string
    res = requests.post(url, json=data)
    if res.status_code == 500:
        print(f"Found 500 on empty {key}!")
        print(res.text)
        
print("Fuzzing complete.")

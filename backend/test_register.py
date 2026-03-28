import requests
import random

url = "http://localhost:8000/api/auth/register/"
rnd = random.randint(1000, 9999)
data = {
    "name": f"Test User {rnd}",
    "username": f"testuser_{rnd}",
    "email": f"test{rnd}@mru.edu.in",
    "phone": f"+9198765{rnd}1",
    "department": "CSE General",
    "college_year": "3rd Year",
    "password": "Password@123",
    "confirm_password": "Password@123",
    "terms_accepted": True,
    "gender": "Male",
    "roll_number": "2011A0511",
    "student_id": "2011A0511"
}

res = requests.post(url, json=data)
print("STATUS:", res.status_code)
print("RESPONSE:", res.text)

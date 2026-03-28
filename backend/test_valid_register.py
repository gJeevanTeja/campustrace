import requests

url = "http://localhost:8000/api/auth/register/"
data = {
    "name": "Jeevan Teja Valid",
    "username": "jeevan_valid",
    "email": "jeevan_valid@mru.edu.in",
    "phone": "+918877665511",
    "department": "CSE General",
    "college_year": "3rd Year",
    "password": "Password@123",
    "confirm_password": "Password@123",
    "terms_accepted": True,
    "college_name": "Malla Reddy University",
    "student_id": "ST1234",
    "gender": "Male"
}

res = requests.post(url, json=data)
print("STATUS:", res.status_code)
print("RESPONSE:", res.text)

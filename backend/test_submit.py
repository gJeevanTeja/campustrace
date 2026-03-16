import requests

url = "http://localhost:8000/api/items/"

headers = {
    # Needs a real token if authentication is required; wait, if it's 401 we would get "detail": "Authentication credentials were not provided."
    # We will try without token, if 401 then we will just login or fetch a token.
}

payload = {
    "type": "lost",
    "title": "Test Title",
    "description": "Test Desc",
    "category": "",
    "category_new": "1",  # Need a valid Category ID
    "block": "1",         # Need a valid Block ID
    "location": "other",
    "location_name": "",
    "location_detail": "",
    "contact_phone": "",
    "latitude": "",
    "longitude": "",
    "incident_datetime": "2026-03-03T10:00:00.000Z"
}

files = {} # 'photos': ('filename.jpg', b'bytes', 'image/jpeg')

response = requests.post(url, data=payload, headers=headers)
print(response.status_code)
print(response.text)

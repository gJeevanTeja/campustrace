import requests

def test_categories():
    url = "http://localhost:8000/api/admin/categories/"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print("Response Content:")
        print(response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_categories()

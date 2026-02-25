import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_register(username, email, password):
    print(f"Testing registration for {username} with password '{password}'...")
    data = {
        "username": username,
        "email": email,
        "password": password,
        "full_name": "Test User",
        "phone": "+998901234567",
        "bio": "Test Bio"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 422:
            print("Validation Error Detail:")
            print(response.json().get("detail"))
        else:
            print("Response:", response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test with simple password (should fail uppercase requirement)
    test_register("testuser1", "test1@example.com", "password123")
    
    # Test with uppercase but no digit (should fail digit requirement)
    test_register("testuser2", "test2@example.com", "Password")
    
    # Test with valid password
    test_register("testuser3", "test3@example.com", "Password123")

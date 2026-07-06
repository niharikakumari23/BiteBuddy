import requests
import json

def test():
    try:
        # Test Health
        r = requests.get("http://127.0.0.1:8000/api/health")
        print("Health Status:", r.status_code, r.json())
        
        # Test Chat
        payload = {
            "messages": [
                {"role": "user", "content": "Recommend a quick food item."}
            ]
        }
        r_chat = requests.post("http://127.0.0.1:8000/api/chat", json=payload)
        print("Chat Status:", r_chat.status_code)
        print("Chat Response:", r_chat.json())
    except Exception as e:
        print("Error during test:", e)

if __name__ == "__main__":
    test()

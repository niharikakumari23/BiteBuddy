import requests

url = "http://localhost:8000/api/meals/scan"
# Create a dummy image file for testing
with open("dummy.png", "wb") as f:
    f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfc\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82')

files = {'image': ('dummy.png', open('dummy.png', 'rb'), 'image/png')}
response = requests.post(url, files=files)
print(response.status_code)
print(response.text)

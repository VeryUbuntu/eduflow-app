import os
from dotenv import load_dotenv
from google import genai

# Load env variables
load_dotenv()

api_key = os.getenv("LLM_API_KEY")

print("-" * 50)
print(f"🔑 Testing with API Key: {api_key[:10]}******")

if not api_key:
    print("❌ Error: LLM_API_KEY not found in environment variables.")
    exit(1)

try:
    client = genai.Client(api_key=api_key)
    print("📋 Listing available models...")
    
    # In new SDK google-genai, it is usually client.models.list()
    # Note: Pager object is iterable
    for m in client.models.list():
        print(f"Found: {m.name}")
        
    print("\n📡 Attempting to use 'gemini-1.5-flash' again...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Hello'
    )
    print("✅ SUCCESS!")
    print(response.text)

except Exception as e:
    print(f"\n❌ ERROR: {e}")

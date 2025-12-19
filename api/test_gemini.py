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
    print("🚀 Initializing google-genai Client...")
    client = genai.Client(api_key=api_key)
    
    print("📡 Sending request to Google (Standard)...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Hello, say "Connection Success" if you can hear me.'
    )
    
    print("\n✅ SUCCESS! Response from Google:")
    print(response.text)
    print("-" * 50)

except Exception as e:
    print("\n❌ FAILURE! Detailed Error:")
    print(e)
    print("-" * 50)
    
    # Try with 'models/' prefix just in case
    try:
        print("\n📡 Retrying with 'models/gemini-1.5-flash' prefix...")
        response = client.models.generate_content(
            model='models/gemini-1.5-flash',
            contents='Hello again.'
        )
        print("✅ SUCCESS with prefix!")
        print(response.text)
    except Exception as e2:
        print(f"❌ Both attempts failed.")

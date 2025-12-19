import os

# New Configuration
NEW_ENV_CONTENT = """LLM_API_KEY=sk-jtgzzfjrymdvlzeziitsgbpifhcvxittbcopfggyltmwsgeh
LLM_BASE_URL=https://api.siliconflow.cn/v1
SECRET_KEY=eduflow-secret-key-2025-updated
"""

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

try:
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(NEW_ENV_CONTENT)
    print(f"✅ Successfully updated .env file at {env_path}")
    print("New Key: sk-jtgzz...sgeh")
except Exception as e:
    print(f"❌ Failed to update .env: {e}")

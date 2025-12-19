from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuration
TARGET_USERNAME = "veryubuntu@gmail.com"
USER_IDS_TO_TRANSFER = [1, 2, 13]  # The IDs you want to claim

SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print(f"🔄 开始执行数据过户...")

# 1. Get Target Account ID
target_account = db.execute(text("SELECT id FROM accounts WHERE username = :name"), {"name": TARGET_USERNAME}).fetchone()

if not target_account:
    print(f"❌ 错误：找不到账号 {TARGET_USERNAME}！请先注册或检查拼写。")
    exit(1)

target_id = target_account[0]
print(f"✅ 找到目标账号 ID: {target_id}")

# 2. Transfer Users
count = 0
for uid in USER_IDS_TO_TRANSFER:
    result = db.execute(text("UPDATE users SET account_id = :aid WHERE id = :uid"), {"aid": target_id, "uid": uid})
    if result.rowcount > 0:
        print(f"   - 成员 ID {uid} 已成功过户。")
        count += 1
    else:
        print(f"   ⚠️ 成员 ID {uid} 不存在，跳过。")

db.commit()
print(f"\n🎉 操作完成！共过户 {count} 名成员到 {TARGET_USERNAME} 名下。")
print("请刷新网页查看效果。")
db.close()

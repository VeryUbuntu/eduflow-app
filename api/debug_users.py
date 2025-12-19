from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("-" * 50)
print("🔍 数据库体检报告")
print("-" * 50)

# Check Accounts
accounts = db.execute(text("SELECT id, username FROM accounts")).fetchall()
print(f"👥 注册账号总数: {len(accounts)}")
for acc in accounts:
    print(f"   - ID: {acc[0]} | 用户名: {acc[1]}")

print("-" * 30)

# Check Users (Family Members)
users = db.execute(text("SELECT id, name, account_id FROM users")).fetchall()
print(f"👶 家庭成员总数: {len(users)}")

orphans = 0
for u in users:
    owner = "未知(NULL)"
    if u[2] is not None:
        owner = f"归属账号ID {u[2]}"
    else:
        orphans += 1
        owner = "⚠️ 孤儿数据 (account_id=NULL)"
    
    print(f"   - 成员ID: {u[0]} | 姓名: {u[1]} | {owner}")

print("-" * 50)
if orphans > 0:
    print(f"🚨 发现 {orphans} 个“失联”的家庭成员！")
    print("💡 原因：这些是旧版本创建的数据，没有绑定到任何账号。")
    print("🛠️ 修复建议：您可以运行 SQL 将它们绑定到某个账号下。")
else:
    print("✅ 所有成员都有归属，数据正常。")
print("-" * 50)

db.close()

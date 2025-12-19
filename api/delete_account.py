from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 要删除的目标账号
TARGET_USERNAME = "veryubuntu@gmail.com"

SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
# Ensure we enable foreign key support if possible, but we will manual delete to be safe
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print(f"🗑️ 准备删除账号: {TARGET_USERNAME} 及其所有关联数据...")

try:
    # 1. Find Account
    account = db.execute(text("SELECT id FROM accounts WHERE username = :name"), {"name": TARGET_USERNAME}).fetchone()
    
    if not account:
        print(f"⚠️ 账号 {TARGET_USERNAME} 不存在，无需删除。")
        exit(0)

    acc_id = account[0]
    print(f"✅ 找到账号 ID: {acc_id}")

    # 2. Find associated Users (Family Members)
    users = db.execute(text("SELECT id, name FROM users WHERE account_id = :aid"), {"aid": acc_id}).fetchall()
    user_ids = [u[0] for u in users]
    
    if user_ids:
        print(f"   - 关联家庭成员: {len(user_ids)} 人 ({', '.join([u[1] for u in users])})")
        
        # 3. Delete Data for these users (CalendarEntries, Goals)
        # Convert list to tuple for SQL IN clause, handling single item tuple syntax
        if len(user_ids) == 1:
            uids_tuple = f"({user_ids[0]})"
        else:
            uids_tuple = str(tuple(user_ids))
            
        print(f"   - 删除学习卡片记录...")
        db.execute(text(f"DELETE FROM calendar_entries WHERE user_id IN {uids_tuple}"))
        
        print(f"   - 删除学习目标...")
        db.execute(text(f"DELETE FROM goals WHERE user_id IN {uids_tuple}"))
        
        print(f"   - 删除用户档案...")
        db.execute(text(f"DELETE FROM users WHERE account_id = :aid"), {"aid": acc_id})
    else:
        print("   - 该账号下没有家庭成员数据。")

    # 4. Delete Account
    print(f"🔥 删除账号本身...")
    db.execute(text("DELETE FROM accounts WHERE id = :aid"), {"aid": acc_id})
    
    db.commit()
    print("-" * 50)
    print(f"🎉 成功！账号 {TARGET_USERNAME} 已彻底注销。")
    print("您现在可以重新注册了。")

except Exception as e:
    print(f"❌ 删除过程中出错: {e}")
    db.rollback()
finally:
    db.close()

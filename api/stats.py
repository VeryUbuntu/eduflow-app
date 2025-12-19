from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from models import Base, Account, User

# Database Setup (Same as main.py)
SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def print_stats():
    db = SessionLocal()
    try:
        # Count Accounts (Families)
        account_count = db.query(Account).count()
        
        # Count Users (Students)
        user_count = db.query(User).count()
        
        # Count Accounts created in last 24h (Needs created_at, ignoring for now)
        
        print("\n" + "=" * 40)
        print(f"📊 EduFlow 实时运营数据")
        print("=" * 40)
        print(f"🏠 注册家庭账号数:   {account_count} 个")
        print(f"👶 累计学生档案数:   {user_count} 人")
        print("=" * 40 + "\n")
        
    except Exception as e:
        print(f"Error fetching stats: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print_stats()

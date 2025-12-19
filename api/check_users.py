from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base

# Define models matching main.py (where subjects is String)
Base = declarative_base()

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    name = Column(String, index=True)
    phase = Column(String)
    grade = Column(String)
    subjects = Column(String) # String in main.py

# Database connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Query Accounts
    accounts = db.query(Account).all()
    print(f"\n=== 注册账号 (Total: {len(accounts)}) ===")
    for acc in accounts:
        print(f"ID: {acc.id} | Email: {acc.username}")

    # Query Family Members
    users = db.query(User).all()
    print(f"\n=== 家庭成员 (Total: {len(users)}) ===")
    for u in users:
        print(f"Name: {u.name} | Grade: {u.grade} | Account ID: {u.account_id}")
        print(f"   Subjects: {u.subjects}")
    print("\n")

except Exception as e:
    print(f"Error reading database: {e}")
finally:
    db.close()

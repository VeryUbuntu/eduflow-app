from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String, index=True, nullable=False) # Maps to Supabase UUID
    name = Column(String, index=True)
    province = Column(String, default="通用")
    phase = Column(String)
    grade = Column(String)
    semester = Column(String, default="下学期")
    month = Column(String, default="第1个月")
    learning_units = Column(String) # Stored as JSON string
    textbook_versions = Column(String) # Stored as JSON string
    subjects = Column(String) # Stored as comma-separated string

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    description = Column(String)
    target_date = Column(String)
    is_active = Column(Boolean, default=True)

class CalendarEntry(Base):
    __tablename__ = "calendar_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String) # YYYY-MM-DD
    content = Column(Text)
    subject = Column(String)

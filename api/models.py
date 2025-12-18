from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    phase = Column(String) 
    grade = Column(String) 
    subjects = Column(JSON) 
    
    goals = relationship("Goal", back_populates="user")
    calendar_entries = relationship("CalendarEntry", back_populates="user")

class Goal(Base):
    __tablename__ = 'goals'
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    target_date = Column(Date)
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey('users.id'))

    user = relationship("User", back_populates="goals")

class CalendarEntry(Base):
    __tablename__ = 'calendar_entries'
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    content = Column(String) 
    subject = Column(String) 
    user_id = Column(Integer, ForeignKey('users.id'))
    
    user = relationship("User", back_populates="calendar_entries")
# No changes needed to schema class definitions themselves, just the logic in main.py

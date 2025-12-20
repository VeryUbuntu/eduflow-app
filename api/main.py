
import os
import random
import json
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from openai import OpenAI
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError

load_dotenv()

# Auth Config
SECRET_KEY = os.getenv("SECRET_KEY", "eduflow-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
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

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Auth Security
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_account(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    account = db.query(Account).filter(Account.username == username).first()
    if account is None:
        raise credentials_exception
    return account

# Pydantic Models
class AccountCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    name: str 
    phase: str 
    grade: str 
    subjects: List[str] 

class UserResponse(BaseModel):
    id: int
    name: str
    phase: str
    grade: str
    subjects: List[str]
    
    class Config:
        from_attributes = True

    # Custom serializer for subjects list (Pydantic V2)
    @field_validator('subjects', mode='before')
    @classmethod
    def split_subjects(cls, v):
        if isinstance(v, str):
            return v.split(',') if v else []
        return v

class CardResponse(BaseModel):
    id: int
    title: str
    content: str
    subject: str
    date: str
    type: str = "educational"

class GoalCreate(BaseModel):
    description: str
    target_date: str 
    
class GoalResponse(BaseModel):
    id: int
    description: str
    target_date: str
    
    class Config:
        from_attributes = True

class ExplainRequest(BaseModel):
    content: str
    subject: str
    grade: str = "通用"
    phase: str = "通用"
    
class ForgotPasswordRequest(BaseModel):
    email: str

# Knowledge Service with OpenAI Client (Restored)
class KnowledgeService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") 
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.siliconflow.cn/v1")
        self.client = None
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        
        self.knowledge_db = {}
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, "data", "knowledge_base.json")
            with open(json_path, "r", encoding="utf-8") as f:
                self.knowledge_db = json.load(f)
        except Exception:
            self.knowledge_db = {"primary": {}, "advanced": {}}

    def generate(self, subject: str, grade: str, phase: str, exclude_topics: List[str] = None):
        if self.client:
            exclude_str = f" Avoid these specific topics: {', '.join(exclude_topics)}." if exclude_topics else ""
            try:
                response = self.client.chat.completions.create(
                    model="Qwen/Qwen2.5-72B-Instruct", 
                    messages=[
                        {"role": "system", "content": "You are a creative and expert tutor. Output high-quality educational knowledge cards. Format: 'Concept Name：Explanation'. Mathematical formulas MUST be standard LaTeX wrapped in single $ signs. Be concise but insightful."},
                        {"role": "user", "content": f"Generate a UNIQUE, interesting, and slightly challenging educational card for a {phase} {grade} student studying {subject}.{exclude_str} Language: Chinese. Max 60 words. Aim for 'lesser-known' facts or clear explanations of core concepts. Format strictly: 'Concept Name：Content'. Pick a random sub-topic. (Entropy: {random.random()})"}
                    ],
                    timeout=30,
                    temperature=0.8
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"LLM Failed: {e}")
        
        # Fallback
        is_primary = "小学" in str(phase)
        target_db = self.knowledge_db.get("primary" if is_primary else "advanced", {})
        candidates = target_db.get(subject)
        if not candidates:
            candidates = target_db.get("通用", [])
        
        # Simple history filtering for fallback too if possible
        if exclude_topics and candidates:
            filtered = [c for c in candidates if not any(topic in c for topic in exclude_topics)]
            if filtered:
                candidates = filtered

        if not candidates:
            candidates = [f"探索发现：{subject}充满了奥秘，保持好奇心！"]
            
        return random.choice(candidates)
             
    def explain(self, content: str, subject: str, grade: str, phase: str):
        print(f"DEBUG_EXPLAIN: Subject={subject}")
        if not self.client:
            return "智能助手暂不可用，请配置 API Key。"
            
        try:
            response = self.client.chat.completions.create(
                model="Qwen/Qwen2.5-72B-Instruct", 
                messages=[
                    {"role": "system", "content": f"You are an expert {subject} tutor for {phase} {grade} students. Your goal is to explain {subject} concepts clearly and accurately."},
                    {"role": "user", "content": f"Please explain the following {subject} concept in detail.\n\nConcept: '{content}'\n\nRequirements:\n1. Explain ONLY this concept.\n2. Use clear, encouraging language suitable for {grade}.\n3. Include examples/formulas if applicable.\n4. Output in Markdown."}
                ],
                timeout=60,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Explain Failed: {str(e)}")
            return "抱歉，生成详解时遇到问题，请稍后再试。"

knowledge_service = KnowledgeService()

# Auth Endpoints
@app.post("/api/register", response_model=Token)
def register(account_in: AccountCreate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.username == account_in.username).first()
    if account:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(account_in.password)
    new_account = Account(username=account_in.username, hashed_password=hashed_password)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    access_token = create_access_token(data={"sub": new_account.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.username == form_data.username).first()
    if not account or not verify_password(form_data.password, account.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": account.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # 1. Check if account exists
    account = db.query(Account).filter(Account.username == req.email).first()
    
    # 2. In a real app, generate a secure token and email it.
    # For now, we just simulate the process.
    if account:
        print(f"Mock: Sending password reset email to {req.email}")
        
    return {"message": "如果在我们的系统中找到改邮箱，重置链接已发送到您的邮箱。"}


@app.post("/api/explain-card")
def explain_card(req: ExplainRequest, db: Session = Depends(get_db)):
    # Note: user_id is not passed in req for ExplainRequest currently
    # We should infer user info or expect it. 
    # Current frontend passes {content, subject} and maybe grade/phase.
    # We might need to fetch user grade from db if not passed.
    # Or just use defaults.
    
    return {"explanation": knowledge_service.explain(req.content, req.subject, req.grade, req.phase)}

@app.get("/api/users", response_model=List[UserResponse])
def get_users(current_account: Account = Depends(get_current_account), db: Session = Depends(get_db)):
    return db.query(User).filter(User.account_id == current_account.id).all()

@app.post("/api/users", response_model=UserResponse)
def create_user(user_in: UserCreate, current_account: Account = Depends(get_current_account), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.name == user_in.name, User.account_id == current_account.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        name=user_in.name,
        phase=user_in.phase,
        grade=user_in.grade,
        subjects=",".join(user_in.subjects), # Convert List to String for DB
        account_id=current_account.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/generate-cards", response_model=List[CardResponse])
def generate_cards(user_id: int, current_date: str, ignore_cache: bool = False, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    date_obj = datetime.strptime(current_date, "%Y-%m-%d").date()
    cards_response = []
    
    # Get recent history to avoid repetition (last 15 entries)
    recent_entries = db.query(CalendarEntry).filter(
        CalendarEntry.user_id == user_id
    ).order_by(CalendarEntry.id.desc()).limit(15).all()
    exclude_topics = []
    for entry in recent_entries:
        parts = entry.content.split('：')
        if parts:
            exclude_topics.append(parts[0])

    # 1. Iterate over ALL subscribed subjects
    user_subjects_list = user.subjects.split(",") if user.subjects else []
    
    if not user_subjects_list:
        subjects_to_cover = ["通用"]
    else:
        subjects_to_cover = user_subjects_list

    for subject in subjects_to_cover:
        # Check cache for THIS subject
        existing_entry = db.query(CalendarEntry).filter(
            CalendarEntry.user_id == user.id, 
            CalendarEntry.date == date_obj,
            CalendarEntry.subject == subject
        ).first()
        
        # If cache hit and not forced refresh, append to result
        if existing_entry and not ignore_cache:
            cards_response.append({
                "id": existing_entry.id,
                "title": f"每日{subject}",
                "content": existing_entry.content,
                "subject": subject,
                "date": current_date
            })
            continue

        # If refresh or not exists, generate
        if existing_entry and ignore_cache:
            db.delete(existing_entry)
            db.commit() 
        
        # Generate new with history exclusion
        content = knowledge_service.generate(subject, user.grade, user.phase, exclude_topics=exclude_topics)
        
        new_entry = CalendarEntry(
            date=date_obj,
            content=content,
            subject=subject,
            user_id=user.id
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        # Add new topic to exclusion list for next subject in same call
        parts = content.split('：')
        if parts:
            exclude_topics.append(parts[0])

        cards_response.append({
            "id": new_entry.id,
            "title": f"每日{subject}",
            "content": content,
            "subject": subject,
            "date": current_date
        })

    return cards_response

@app.post("/api/regenerate-card", response_model=CardResponse)
def regenerate_single_card(user_id: int, subject: str, current_date: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    date_obj = datetime.strptime(current_date, "%Y-%m-%d").date()
    
    # Get recent history (last 15 entries)
    recent_entries = db.query(CalendarEntry).filter(
        CalendarEntry.user_id == user_id
    ).order_by(CalendarEntry.id.desc()).limit(15).all()
    exclude_topics = [e.content.split('：')[0] for e in recent_entries if '：' in e.content]

    # 1. Find and Delete existing
    existing = db.query(CalendarEntry).filter(
        CalendarEntry.user_id == user.id,
        CalendarEntry.date == date_obj,
        CalendarEntry.subject == subject
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
    
    # 2. Generate New
    content = knowledge_service.generate(subject, user.grade, user.phase, exclude_topics=exclude_topics)
    
    new_entry = CalendarEntry(
        date=date_obj,
        content=content,
        subject=subject,
        user_id=user.id
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return {
        "id": new_entry.id,
        "title": f"每日{subject}",
        "content": content,
        "subject": subject,
        "date": current_date
    }

@app.get("/api/users/{user_id}/goal", response_model=Optional[GoalResponse])
def get_user_goal(user_id: int, db: Session = Depends(get_db)):
    # Get the latest active goal
    goal = db.query(Goal).filter(
        Goal.user_id == user_id,
        Goal.is_active == True
    ).order_by(Goal.id.desc()).first()
    
    if not goal:
        return None
    return GoalResponse(
        id=goal.id,
        description=goal.description,
        target_date=goal.target_date
    )

@app.post("/api/users/{user_id}/goal", response_model=GoalResponse)
def set_user_goal(user_id: int, goal_in: GoalCreate, db: Session = Depends(get_db)):
    # Deactivate old goals
    old_goals = db.query(Goal).filter(
        Goal.user_id == user_id, 
        Goal.is_active == True
    ).all()
    for g in old_goals:
        g.is_active = False
    
    new_goal = Goal(
        description=goal_in.description,
        target_date=goal_in.target_date, # Raw string
        user_id=user_id,
        is_active=True
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return GoalResponse(
        id=new_goal.id,
        description=new_goal.description,
        target_date=new_goal.target_date
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

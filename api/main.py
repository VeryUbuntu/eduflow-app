from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import uvicorn
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, User, Goal, CalendarEntry
import random
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Models
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

# --- LLM Service ---
class KnowledgeService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") 
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.client = None
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        
        # Load Local Knowledge Base
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, "data", "knowledge_base.json")
            with open(json_path, "r", encoding="utf-8") as f:
                self.knowledge_db = json.load(f)
        except Exception as e:
            print(f"Failed to load knowledge base: {e}")
            self.knowledge_db = {"primary": {}, "advanced": {}}

    def generate(self, subject: str, grade: str, phase: str):
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    # model="gpt-3.5-turbo", # Old Model
                    # model="deepseek-ai/DeepSeek-V2.5", # SiliconFlow Model
                    model="Qwen/Qwen2.5-72B-Instruct", # SiliconFlow Qwen Model (More Stable)
                    messages=[
                        {"role": "system", "content": "You are a helpful tutor. Output only the content of a knowledge card. Format: 'Concept Name：Concept Explanation'. Mathematical formulas MUST be standard LaTeX wrapped in single $ signs."},
                        {"role": "user", "content": f"Generate a RANDOM, UNIQUE, interesting educational fact or tip for a {phase} {grade} student studying {subject}. Language: Chinese. Max 50 words. Format strictly as 'Concept Name：Content'. Example: '勾股定理：$a^2+b^2=c^2$'. Do NOT include the word 'Title' or '标题'. Pick a different topic each time. (RandomId: {random.randint(1, 10000)})"}
                    ],
                    timeout=30
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"LLM Failed: {e}")
        
        # Fallback to Local DB
        is_primary = "小学" in str(phase)
        target_db = self.knowledge_db.get("primary" if is_primary else "advanced", {})
        
        fallback = [f"探索发现：保持好奇心，继续探索{subject}的奥秘！"]
        candidates = target_db.get(subject, fallback)
        
        # Try to find subject in JSON
        candidates = target_db.get(subject)
        
        # If subject not found, try '通用' as secondary fallback
        if not candidates:
            candidates = target_db.get("通用", [])
            
        # If still empty, use hard fallback
        if not candidates:
             candidates = [f"探索发现：{subject}充满了奥秘，保持好奇心！"]
             
        return random.choice(candidates)
             
    def explain(self, content: str, subject: str, grade: str, phase: str):
        if not self.client:
            return "智能助手暂不可用，请配置 API Key。"
            
        try:
            response = self.client.chat.completions.create(
                # model="deepseek-chat", # Official DeepSeek Model
                # model="deepseek-ai/DeepSeek-V2.5", # SiliconFlow Model
                model="Qwen/Qwen2.5-72B-Instruct", # SiliconFlow Qwen Model (More Stable)
                messages=[
                    {"role": "system", "content": "You are a helpful expert tutor."},
                    {"role": "user", "content": f"Please provide a detailed, easy-to-understand explanation of the following knowledge point for a {phase} {grade} student studying {subject}. \n\nKnowledge Point: {content}\n\nInclude examples, context, or formulas if necessary. Output in Markdown with LaTeX support for math."}
                ],
                timeout=60,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Explain Failed: {str(e)}")
            if "Insufficient Balance" in str(e) or "402" in str(e):
                return "API 余额不足，无法生成详解，请检查 DeepSeek 账户余额。"
            return "抱歉，生成详解时遇到问题，请稍后再试。"

knowledge_service = KnowledgeService()

# APIs

class ExplainRequest(BaseModel):
    content: str
    subject: str
    user_id: int

@app.post("/api/explain-card")
def explain_card(req: ExplainRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    explanation = knowledge_service.explain(req.content, req.subject, user.grade, user.phase)
    return {"explanation": explanation}

@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.post("/api/users", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.name == user_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        name=user_in.name,
        phase=user_in.phase,
        grade=user_in.grade,
        subjects=user_in.subjects
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
    
    # 1. Iterate over ALL subscribed subjects
    if not user.subjects:
        subjects_to_cover = ["通用"]
    else:
        subjects_to_cover = user.subjects

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
            db.commit() # Commit delete immediately
        
        # Generate new
        content = knowledge_service.generate(subject, user.grade, user.phase)
        
        new_entry = CalendarEntry(
            date=date_obj,
            content=content,
            subject=subject,
            user_id=user.id
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
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
    content = knowledge_service.generate(subject, user.grade, user.phase)
    
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
        target_date=goal.target_date.strftime("%Y-%m-%d")
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
        target_date=datetime.strptime(goal_in.target_date, "%Y-%m-%d").date(),
        user_id=user_id,
        is_active=True
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return GoalResponse(
        id=new_goal.id,
        description=new_goal.description,
        target_date=new_goal.target_date.strftime("%Y-%m-%d")
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

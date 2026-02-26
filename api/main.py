import os
import random
import json
import re
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from openai import OpenAI
from dotenv import load_dotenv
from jose import jwt, JWTError

load_dotenv()

# We only need SUPABASE_JWT_SECRET now for verification
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "this-is-a-placeholder-for-dev-only-should-be-long-enough")

SQLALCHEMY_DATABASE_URL = "sqlite:///./eduflow.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String, index=True, nullable=False) # Maps to Supabase UUID
    name = Column(String, index=True)
    province = Column(String, default="通用")
    phase = Column(String)
    grade = Column(String)
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

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in prod (e.g., eduflow.sxu.com)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/error", auto_error=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user_uuid(token: str = Depends(oauth2_scheme)):
    # Default to a mock 'sub' in development if no token is provided
    if not token or token == "mock-uuid-development-001" or token == "mock":
        print("Warning: No token provided or mocked. Using mock auth_id for development.")
        return "mock-uuid-development-001"
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # In a real scenario with correct SUPABASE_JWT_SECRET, options={"verify_signature": True}
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_signature": False})
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception

# Pydantic Models
class UserCreate(BaseModel):
    name: str 
    phase: str 
    grade: str 
    province: str = "通用"
    textbook_versions: Dict[str, str] = {}
    subjects: List[str] 

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phase: Optional[str] = None
    grade: Optional[str] = None
    province: Optional[str] = None
    textbook_versions: Optional[Dict[str, str]] = None
    subjects: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: int
    auth_id: str
    name: str
    phase: str
    grade: str
    province: str
    textbook_versions: Dict[str, str]
    subjects: List[str]
    
    class Config:
        from_attributes = True

    @field_validator('subjects', mode='before')
    @classmethod
    def split_subjects(cls, v):
        if isinstance(v, str):
            return v.split(',') if v else []
        return v

    @field_validator('textbook_versions', mode='before')
    @classmethod
    def parse_textbooks(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return {}
        return v or {}

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

# Knowledge Service
def extract_topic(content: str) -> str:
    clean_content = re.sub(r'^(Topic|Concept|主题|概念|知识点|Title|标题)[:：\-\s]+', '', content, flags=re.I)
    parts = re.split(r'[:：]', clean_content, maxsplit=1)
    return parts[0].strip() if parts else clean_content.strip()

def is_duplicate(new_topic: str, excluded_topics: List[str]) -> bool:
    if not excluded_topics: return False
    new_t = new_topic.lower()
    for ex in excluded_topics:
        ex_t = ex.lower()
        if ex_t in new_t or new_t in ex_t:
            return True
    return False

def get_semester_progress(current_date_str: str) -> str:
    # A rough heuristic for semester progress
    try:
        d = datetime.strptime(current_date_str, "%Y-%m-%d")
        month = d.month
        # Assume Spring semester starts ~Feb 15
        if month in [2, 3]: return "春季学期开学初期"
        if month in [4]: return "春季学期期中阶段"
        if month in [5, 6]: return "春季学期期末复习阶段"
        # Assume Fall semester starts ~Sep 1
        if month in [9]: return "秋季学期开学初期"
        if month in [10, 11]: return "秋季学期期中阶段"
        if month in [12, 1]: return "秋季学期期末复习阶段"
        return "寒暑假自主复习阶段"
    except:
        return ""

class KnowledgeService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") 
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.siliconflow.cn/v1")
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url) if self.api_key else None

    def generate(self, subject: str, phase: str, grade: str, province: str, textbook_version: str, current_date: str = None, exclude_topics: List[str] = None):
        if self.client:
            progress = get_semester_progress(current_date or datetime.now().strftime("%Y-%m-%d"))
            
            # Step 1: "Search" TapXWorld/ChinaTextbook for the Syllabus Chapter
            search_prompt = f"请作为教材目录检索系统，在开源的 'TapXWorld/ChinaTextbook' 中国小初高大学教材数据库中进行检索。\n"
            search_prompt += f"任务：查找【{province}】地区【{phase}{grade}】使用的【{subject}】【{textbook_version}】的课本大纲。\n"
            search_prompt += f"结合当前的教学进度节点：【{progress}】（当前系统日期：{current_date}）。\n"
            search_prompt += f"请直接输出当前进度下，该学生最有可能正在学习的具体【单元名称】或【小节标题】内容。只要标题信息即可，不要做过多解释。（例如：第三章 动量守恒定理，第一节 动量）。\n"
            if exclude_topics:
                display_exclude = exclude_topics[:20] 
                search_prompt += f"\n关键过滤规则：绝对不要生成这些已经学过的周边知识点：{', '.join(display_exclude)}。如果不确定，请挑选一个比较新的后续章节。"

            for attempt in range(4):
                try:
                    # 1. Retrieve Chapter
                    chapter_response = self.client.chat.completions.create(
                        model="Qwen/Qwen2.5-72B-Instruct", 
                        messages=[{"role": "user", "content": search_prompt + f"\n(Random Seed: {random.random()})"}],
                        timeout=30,
                        temperature=0.8
                    )
                    chapter_target = chapter_response.choices[0].message.content.strip()
                    
                    # 2. Generate Card
                    generate_system = f"你是一名为中国大陆{province}的{phase}{grade}学生提供每日学习卡片的AI家教专家。"
                    generate_user = f"经 'TapXWorld/ChinaTextbook' 教材库大纲匹配，该生今天应学习的教材进度对应章节是：【{chapter_target}】（科目：{subject}，版本：{textbook_version}）。\n"
                    generate_user += "请提取该小节中的一个重点，生成一张今天的知识卡片。\n"
                    generate_user += "要求包含：核心概念讲解、一个典型例题（如果适用）、和简要解析。\n"
                    generate_user += "格式要求：必须以 '概念概要名称：...' 开头。总体字数控制在 80-120 字左右。\n"
                    
                    card_response = self.client.chat.completions.create(
                        model="Qwen/Qwen2.5-72B-Instruct", 
                        messages=[
                            {"role": "system", "content": generate_system},
                            {"role": "user", "content": generate_user}
                        ],
                        timeout=30,
                        temperature=0.8
                    )
                    content = card_response.choices[0].message.content
                    new_topic = extract_topic(content)
                    if is_duplicate(new_topic, exclude_topics) and attempt < 3:
                        continue 
                    return content
                except Exception as e:
                    print(f"LLM Failed: {e}")
                    break 
        
        return f"探索发现：深入学习{subject}中的新知识，不断前行！(需配置LLM)"

    def explain(self, content: str, subject: str, grade: str, phase: str):
        if not self.client:
            return "智能助手暂不可用，请配置 API Key。"
        try:
            response = self.client.chat.completions.create(
                model="Qwen/Qwen2.5-72B-Instruct", 
                messages=[
                    {"role": "system", "content": f"You are an expert {subject} tutor for {phase} {grade} students."},
                    {"role": "user", "content": f"Please explain the following {subject} concept in detail.\n\nConcept: '{content}'\n\nRequirements:\n1. Explain ONLY this concept.\n2. Use clear, encouraging language suitable for {grade}.\n3. Include examples/formulas if applicable.\n4. Output in Markdown. IMPORTANT: You MUST enclose ALL math formulas/symbols in $...$ (inline) or $$...$$ (block) for LaTeX rendering."}
                ],
                timeout=60,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            return "抱歉，生成详解时遇到问题，请稍后再试。"

knowledge_service = KnowledgeService()

# Endpoints
@app.get("/api/users", response_model=List[UserResponse])
def get_users(auth_id: str = Depends(get_current_user_uuid), db: Session = Depends(get_db)):
    return db.query(User).filter(User.auth_id == auth_id).all()

@app.post("/api/users", response_model=UserResponse)
def create_user(user_in: UserCreate, auth_id: str = Depends(get_current_user_uuid), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.name == user_in.name, User.auth_id == auth_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        name=user_in.name,
        phase=user_in.phase,
        grade=user_in.grade,
        province=user_in.province,
        textbook_versions=json.dumps(user_in.textbook_versions),
        subjects=",".join(user_in.subjects),
        auth_id=auth_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_in: UserUpdate, auth_id: str = Depends(get_current_user_uuid), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.auth_id == auth_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.name is not None: user.name = user_in.name
    if user_in.phase is not None: user.phase = user_in.phase
    if user_in.grade is not None: user.grade = user_in.grade
    if user_in.province is not None: user.province = user_in.province
    if user_in.textbook_versions is not None: user.textbook_versions = json.dumps(user_in.textbook_versions)
    if user_in.subjects is not None: user.subjects = ",".join(user_in.subjects)
    
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, auth_id: str = Depends(get_current_user_uuid), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.auth_id == auth_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.query(Goal).filter(Goal.user_id == user_id).delete()
    db.query(CalendarEntry).filter(CalendarEntry.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.post("/api/generate-cards", response_model=List[CardResponse])
def generate_cards(user_id: int, current_date: str, ignore_cache: bool = False, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    date_obj = datetime.strptime(current_date, "%Y-%m-%d").date()
    cards_response = []
    
    recent_entries = db.query(CalendarEntry).filter(CalendarEntry.user_id == user_id).order_by(CalendarEntry.id.desc()).limit(30).all()
    exclude_topics = [extract_topic(e.content) for e in recent_entries]
    
    user_subjects_list = user.subjects.split(",") if user.subjects else ["通用"]
    try:
        versions_map = json.loads(user.textbook_versions) if user.textbook_versions else {}
    except:
        versions_map = {}

    for subject in user_subjects_list:
        existing_entry = db.query(CalendarEntry).filter(
            CalendarEntry.user_id == user.id, 
            CalendarEntry.date == date_obj,
            CalendarEntry.subject == subject
        ).first()
        
        if existing_entry and not ignore_cache:
            cards_response.append({"id": existing_entry.id, "title": f"每日{subject}", "content": existing_entry.content, "subject": subject, "date": current_date})
            continue

        if existing_entry and ignore_cache:
            db.delete(existing_entry)
            db.commit() 
        
        tb_version = versions_map.get(subject, "统编/人教版")
        content = knowledge_service.generate(subject, user.phase, user.grade, user.province, tb_version, current_date=current_date, exclude_topics=exclude_topics)
        
        new_entry = CalendarEntry(date=date_obj, content=content, subject=subject, user_id=user.id)
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        parts = content.split('：')
        if parts: exclude_topics.append(parts[0])

        cards_response.append({"id": new_entry.id, "title": f"每日{subject}", "content": content, "subject": subject, "date": current_date})

    return cards_response

@app.post("/api/regenerate-card", response_model=CardResponse)
def regenerate_single_card(user_id: int, subject: str, current_date: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    date_obj = datetime.strptime(current_date, "%Y-%m-%d").date()
    recent_entries = db.query(CalendarEntry).filter(CalendarEntry.user_id == user_id).order_by(CalendarEntry.id.desc()).limit(30).all()
    exclude_topics = [extract_topic(e.content) for e in recent_entries]
    
    existing = db.query(CalendarEntry).filter(CalendarEntry.user_id == user.id, CalendarEntry.date == date_obj, CalendarEntry.subject == subject).first()
    if existing:
        db.delete(existing)
        db.commit()
    
    try:
        versions_map = json.loads(user.textbook_versions) if user.textbook_versions else {}
    except:
        versions_map = {}
    tb_version = versions_map.get(subject, "统编/人教版")

    content = knowledge_service.generate(subject, user.phase, user.grade, user.province, tb_version, current_date=current_date, exclude_topics=exclude_topics)
    new_entry = CalendarEntry(date=date_obj, content=content, subject=subject, user_id=user.id)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return {"id": new_entry.id, "title": f"每日{subject}", "content": content, "subject": subject, "date": current_date}

@app.get("/api/users/{user_id}/goal", response_model=Optional[GoalResponse])
def get_user_goal(user_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.user_id == user_id, Goal.is_active == True).order_by(Goal.id.desc()).first()
    return GoalResponse(id=goal.id, description=goal.description, target_date=goal.target_date) if goal else None

@app.post("/api/users/{user_id}/goal", response_model=GoalResponse)
def set_user_goal(user_id: int, goal_in: GoalCreate, db: Session = Depends(get_db)):
    db.query(Goal).filter(Goal.user_id == user_id, Goal.is_active == True).update({"is_active": False})
    new_goal = Goal(description=goal_in.description, target_date=goal_in.target_date, user_id=user_id, is_active=True)
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return GoalResponse(id=new_goal.id, description=new_goal.description, target_date=new_goal.target_date)

@app.post("/api/explain-card")
def explain_card(req: ExplainRequest):
    return {"explanation": knowledge_service.explain(req.content, req.subject, req.grade, req.phase)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

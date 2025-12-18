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
    
    def get_mock_content(self, subject, grade, phase):
        # Structured Mock Data Separation
        # Primary = 小学
        # Secondary = 初中, 高中, 大学
        
        print(f"DEBUG: Generating content for Phase={phase}, Subject={subject}") # Debug print
        is_primary = "小学" in str(phase) # Make check more robust

        primary_db = {
            "数学": [
                "九九乘法表：熟记 9x9 以内的乘法是计算的基础。",
                "认识图形：正方形有四条边，四个角都是直角。",
                "分数的初步认识：把一个苹果平均分成两份，每份是二分之一。",
                "加减法技巧：凑十法可以让计算更快乐！",
                "时钟认识：短针是时针，长针是分针。",
            ],
            "语文": [
                "古诗：鹅鹅鹅，曲项向天歌。白毛浮绿水，红掌拨清波。",
                "拼音：a o e i u ü，声调由于不同，意思也不同。",
                "成语：【井底之蛙】比喻见识短浅的人。",
                "词语：高兴、快乐、开心都是表示心情好的词。",
            ],
            "英语": [
                "Greetings：Hello! How are you?",
                "Colors：Red(红), Blue(蓝), Green(绿).",
                "Animals：Cat(猫), Dog(狗), Elephant(大象).",
                "Numbers：One, Two, Three...",
                "Fruits：Apple, Banana, Orange.",
            ],
            "物理": [
                "自然常识：为什么苹果会往下掉？因为有地球引力。",
                "光影游戏：影子是因为光被物体挡住了。",
                "浮力：为什么大船能浮在水面上？",
            ],
            "化学": [
                "生活常识：食盐可以用来调味，也可以用来融雪。",
                "水的变化：冰化成水，水变成水蒸气。",
            ],
            "生物": [
                "植物生长：植物需要阳光、空气和水才能长大。",
                "动物常识：青蛙小时候是蝌蚪。",
                "人体奥秘：我们要刷牙来保护牙齿。",
            ],
            "历史": [
                "传说故事：大禹治水，三过家门而不入。",
                "古代发明：指南针可以帮我们辨别方向。",
            ],
            "地理": [
                "认识地图：上北下南，左西右东。",
                "我们的家：地球是一个蓝色的星球。",
            ]
        }

        advanced_db = {
            "数学": [
                "勾股定理：a² + b² = c²，适用于直角三角形。",
                "圆的面积：S = πr²，周长 C = 2πr。",
                "一元二次方程：ax² + bx + c = 0 的判别式 Δ = b² - 4ac。",
                "正弦定理：a/sinA = b/sinB = c/sinC = 2R。",
                "概率的基本性质：0 ≤ P(A) ≤ 1。",
                "函数的单调性：导数大于0，函数单调递增。",
            ],
            "物理": [
                "牛顿第一定律：一切物体在没有受到外力作用的时候，总保持匀速直线运动状态或静止状态。",
                "密度公式：ρ = m/V (质量/体积)。",
                "压强公式：P = F/S (压力/受力面积)。",
                "欧姆定律：I = U/R。",
                "动能：Ek = 1/2mv²。",
            ],
            "语文": [
                "诗词赏析：李白《静夜思》举头望明月，低头思故乡。",
                "修辞手法：比喻、拟人、排比、夸张。",
                "成语：【铁杵磨成针】形容坚持不懈。",
                "文言文：常用虚词：之、乎、者、也。",
                "议论文：三要素：论点、论据、论证。",
            ],
            "英语": [
                "Grammar：The passive voice is formed with 'be + past participle'.",
                "Word of the Day：Ambitious (有雄心的)。",
                "Clause：This is the book which I bought yesterday.",
                "Tense：Present Perfect Tense indicates an action happened at an indefinite time in the past.",
            ],
            "化学": [
                "化学式：水的化学式 H₂O。",
                "氧化反应：物质与氧发生的反应。",
                "pH值：< 7 为酸性，> 7 为碱性。",
                "原子结构：原子由质子、中子和电子构成。",
                "元素周期表：第1号元素是氢(H)。",
            ],
            "生物": [
                "光合作用：场所是叶绿体。",
                "人体器官：最大的器官是皮肤。",
                "遗传物质：DNA是主要的遗传物质。",
                "细胞分裂：一个细胞分成两个细胞。",
                "生态系统：生产者、消费者、分解者。",
            ],
            "历史": [
                "秦统一六国：秦始皇于公元前221年统一六国。",
                "汉武帝：罢黜百家，独尊儒术。",
                "工业革命：始于18世纪60年代的英国。",
                "丝绸之路：促进了东西方文化交流。",
                "辛亥革命：推翻了清王朝的统治。",
            ],
            "地理": [
                "地球自转：方向是自西向东。",
                "世界高原：世界最大的高原是巴西高原，最高的高原是青藏高原。",
                "赤道：周长约4万千米。",
                "中国地势：西高东低，呈阶梯状分布。",
                "温室效应：导致全球变暖。",
            ]
        }
        
        target_db = primary_db if is_primary else advanced_db
        fallback = [f"探索发现：保持好奇心，继续探索{subject}的奥秘！"]
        
        candidates = target_db.get(subject, fallback)
        content = random.choice(candidates)
        return content

    def generate(self, subject: str, grade: str, phase: str):
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful tutor. Output only the content of a knowledge card."},
                        {"role": "user", "content": f"Generate a single, interesting, short educational fact or tip for a {phase} {grade} student studying {subject}. Language: Chinese. Max 50 words."}
                    ],
                    timeout=5
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"LLM Failed: {e}")
        return self.get_mock_content(subject, grade, phase)

knowledge_service = KnowledgeService()

# APIs

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

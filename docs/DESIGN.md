# EduFlow 系统设计文档

## 1. 技术栈
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/UI.
- **Backend**: FastAPI (Python), SQLAlchemy.
- **Database**: SQLite (local `eduflow.db`).
- **Dependencies**: 
    - Frontend: `@dnd-kit/core`, `@dnd-kit/sortable`, `date-fns`, `lucide-react`, `framer-motion` (removed in favor of dnd-kit for grid).
    - Backend: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`.

## 2. 数据库设计 (models.py)

### 2.1 User (用户)
- `id`: Integer, Primary Key
- `name`: String, Unique
- `phase`: String (e.g., "小学", "初中")
- `grade`: String
- `subjects`: JSON (List of strings)

### 2.2 CalendarEntry (每日卡片记录)
- `id`: Integer, Primary Key
- `date`: Date
- `user_id`: Integer, ForeignKey
- `subject`: String
- `content`: String
- *设计意图*：持久化存储每日生成的卡片，避免刷新页面后内容消失。支持通过 API 强制刷新（`delete` -> `create`）。

### 2.3 Goal (目标)
- `id`: Integer, Primary Key
- `user_id`: Integer, ForeignKey
- `description`: String
- `target_date`: Date
- `is_active`: Boolean
- *设计意图*：支持多目标历史记录，但在界面上只读取最新的 `is_active=True` 的目标。

## 3. 后端逻辑 (api/main.py)

### 3.1 内容生成服务 (KnowledgeService)
- **Mock Data**: 内置了 `primary_db` (小学) 和 `advanced_db` (中学/通用) 两个庞大的知识库字典。
- **Leveling Logic**: 
    - 方法 `generate(subject, grade, phase)`
    - 逻辑：检测 `phase` 是否包含 "小学"。若是，优先从 `primary_db` 获取；否则从 `advanced_db` 获取。解决“二年级出现概率论”的问题。
- **LLM Support**: 预留了 OpenAI API 接口调用结构，当 `LLM_API_KEY` 存在时可切换为 AI 生成。

### 3.2 API Endpoints
- `POST /api/generate-cards`: 获取今日卡片。逻辑：先查库，有则返回；无则调用 `KnowledgeService` 生成并存库。
- `POST /api/regenerate-card`: 强制刷新单张卡片。逻辑：删库中对应记录 -> 生成新内容 -> 存库 -> 返回。
- `GET/POST /api/users/{id}/goal`: 获取/设置用户目标。

## 4. 前端设计 (app/page.tsx)

### 4.1 组件结构
- `Home` (Page Component)
    - `Sidebar`: 用户列表、切换用户、添加用户入口。
    - `Main`:
        - `Header`: 
            - 日期展示
            - **Goal Countdown**: 倒计时组件（青色主题）。
            - **Date Strip**: 月度日期横条（无框、周末红字）。
        - `Content Body`:
            - `DndContext` / `SortableContext`: 拖拽上下文。
            - `SortableCard`: 卡片组件。包含左对齐的标题/正文、科目 Badge、刷新按钮、底部装饰条。
    - `UserSetup`: 首次访问或添加用户时的全屏/模态向导。

### 4.2 状态管理
- 使用 React `useState` 管理 `currentUser`, `dailyCards`, `userGoal`。
- 切换用户时 (`handleSwitchUser`)：**立即清空** `dailyCards` 和 `userGoal`，触发 UI 刷新，随后 `useEffect` 加载新用户数据。

### 4.3 样式细节
- **背景**: `main` 区域使用 SVG Data URI 实现 30px x 30px 的虚线格子背景 (`rgba(0,0,0,0.05)`).
- **卡片**: 白色卡片，圆角 `rounded-2xl`，悬浮阴影 `hover:shadow-xl`。根据科目动态匹配颜色 (`SUBJECT_COLORS` 映射)。

# 🎓 Eduflow - 智能学习助手

<div align="center">

![Eduflow Logo](https://via.placeholder.com/150x150.png?text=Eduflow)

**个性化 AI 驱动的学习管理平台**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Production Ready](https://img.shields.io/badge/production-ready-green.svg)](CTO_REPORT.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688)](https://fastapi.tiangolo.com/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [部署](#-生产部署) • [文档](#-文档)

</div>

---

## 📖 项目简介

Eduflow 是一个面向中小学生的智能学习助手，通过 AI 技术为每位学生提供个性化的知识卡片和学习建议。

### ✨ 核心功能

- 🎯 **个性化学习计划** - 基于年级和学习目标定制
- 📅 **智能日历** - 每日自动生成知识卡片
- 🤖 **AI 深度解释** - 点击任意知识点获取详细讲解
- 📊 **学习目标跟踪** - 设置和监控学习进度
- 👥 **多学生管理** - 一个账号管理多个学习者
- 🎨 **现代化 UI** - 基于 Tailwind CSS 的精美界面

### 🛠️ 技术栈

**前端:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/ui

**后端:**
- Python FastAPI
- SQLAlchemy ORM
- SQLite (可升级到 PostgreSQL)
- JWT 认证

**AI 集成:**
- OpenAI SDK
- SiliconFlow API (Qwen 模型)

---

## 🚀 快速开始

### 本地开发

#### 前置要求

- Node.js 18+ 
- Python 3.9+
- Git

#### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/eduflow-app.git
cd eduflow-app

# 2. 安装前端依赖
npm install

# 3. 设置后端
cd api
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env
nano .env  # 填入你的 API Key

# 5. 初始化数据库
python3 -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"

# 6. 启动后端 (保持终端运行)
uvicorn main:app --reload --port 8000
```

在新终端中：

```bash
# 7. 启动前端
cd eduflow-app
npm run dev
```

访问 `http://localhost:3000` 🎉

---

## 🌐 生产部署

### 一键部署到 VPS

```bash
# 在 VPS 上执行
cd /var/www
git clone https://github.com/your-username/eduflow-app.git
cd eduflow-app

# 配置域名
nano deploy/deploy.sh  # 修改 DOMAIN 和 EMAIL

# 执行部署
sudo ./deploy/deploy.sh

# 配置 API Key
nano /var/www/eduflow-app/api/.env

# 重启服务
pm2 restart all
```

**⏱️ 部署时间**: 约 15 分钟  
**📚 详细文档**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md)

### 系统要求

| 用户规模 | CPU | 内存 | 硬盘 | 月费用 |
|---------|-----|------|------|--------|
| <50 | 1核 | 1GB | 20GB | ~$5 |
| <500 | 2核 | 2GB | 40GB | ~$10 |
| <5000 | 4核 | 4GB | 80GB | ~$40 |

---

## 📚 文档

### 快速参考

- 📋 [CTO 报告](CTO_REPORT.md) - 项目状态和部署总结
- 🚀 [部署指南](DEPLOYMENT.md) - 完整部署步骤
- 📖 [快速参考](QUICK_REFERENCE.md) - 常用命令和故障排查
- 🏥 [健康检查](deploy/HEALTH_CHECK.md) - 监控和维护

### 架构文档

- [项目结构](#项目结构)
- [API 文档](#api-文档)
- [数据库模型](#数据库模型)

---

## 📁 项目结构

```
eduflow-app/
├── app/                    # Next.js 页面和路由
│   ├── page.tsx           # 主页面（日历界面）
│   ├── login/            # 登录页
│   └── register/         # 注册页
├── components/            # React 组件库
│   ├── ui/               # Shadcn/ui 组件
│   └── ...               # 自定义组件
├── api/                   # Python FastAPI 后端
│   ├── main.py           # 主 API 服务
│   ├── models.py         # 数据库模型
│   ├── requirements.txt  # Python 依赖
│   └── .env              # 环境变量（本地）
├── deploy/                # 部署脚本和配置
│   ├── deploy.sh         # 一键部署脚本
│   ├── nginx.conf        # Nginx 配置
│   ├── backup.sh         # 数据库备份
│   └── pre-deploy-check.sh # 部署前检查
├── public/                # 静态资源
├── ecosystem.config.js    # PM2 配置
├── next.config.mjs        # Next.js 配置
└── package.json           # Node.js 依赖
```

---

## 🔌 API 文档

### 认证端点

- `POST /api/register` - 注册新账户
- `POST /api/token` - 用户登录
- `POST /api/forgot-password` - 重置密码

### 用户管理

- `GET /api/users` - 获取学习者列表
- `POST /api/users` - 创建学习者

### 知识卡片

- `POST /api/generate-cards` - 生成每日卡片
- `POST /api/regenerate-card` - 重新生成单张卡片
- `POST /api/explain-card` - AI 深度解释

### 学习目标

- `GET /api/users/{user_id}/goal` - 获取学习目标
- `POST /api/users/{user_id}/goal` - 设置学习目标

**完整 API 文档**: 启动后访问 `/docs`

---

## 💾 数据库模型

### Account (账户)
```python
- id: 主键
- username: 用户名（唯一）
- hashed_password: 加密密码
```

### User (学习者)
```python
- id: 主键
- account_id: 关联账户
- name: 姓名
- phase: 学段（小学/初中）
- grade: 年级
- subjects: 订阅科目
```

### CalendarEntry (知识卡片)
```python
- id: 主键
- user_id: 关联学习者
- date: 日期
- content: 卡片内容
- subject: 科目
```

### Goal (学习目标)
```python
- id: 主键
- user_id: 关联学习者
- description: 目标描述
- target_date: 目标日期
- is_active: 是否激活
```

---

## 🔧 常用命令

### 开发

```bash
npm run dev          # 启动前端开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
```

### 生产环境

```bash
pm2 status           # 查看服务状态
pm2 logs             # 查看日志
pm2 restart all      # 重启所有服务
./deploy/backup.sh   # 备份数据库
```

更多命令请参考 [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 🛡️ 安全性

- ✅ JWT 令牌认证
- ✅ 密码 bcrypt 加密
- ✅ HTTPS 加密传输
- ✅ CORS 保护
- ✅ SQL 注入防护（ORM）
- ✅ XSS 防护

---

## 📈 性能优化

- ✅ Next.js 服务端渲染 (SSR)
- ✅ 自动代码分割
- ✅ 图片优化
- ✅ Nginx Gzip 压缩
- ✅ HTTP/2 支持
- ⚙️ 可选：Redis 缓存
- ⚙️ 可选：CDN 加速

---

## 🐛 故障排查

### 常见问题

**Q: 前端无法连接后端？**  
A: 检查 `.env.production` 中的 `NEXT_PUBLIC_API_URL` 配置

**Q: AI 解释不工作？**  
A: 确保 `api/.env` 中的 `LLM_API_KEY` 已正确配置

**Q: PM2 服务启动失败？**  
A: 运行 `pm2 logs` 查看详细错误信息

更多问题请查看 [QUICK_REFERENCE.md](QUICK_REFERENCE.md#-快速问题排查)

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👨‍💻 作者

**CTO Team**

- 📧 Email: your-email@example.com
- 🌐 Website: https://your-domain.com
- 💼 LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web 框架
- [Shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [SiliconFlow](https://siliconflow.cn/) - AI API 提供商

---

## 📊 项目状态

- ✅ 生产环境就绪
- ✅ 完整文档
- ✅ 自动化部署
- ✅ SSL 支持
- ✅ 监控配置

**最后更新**: 2026-02-07  
**版本**: 1.0.0  
**状态**: 🚀 Production Ready

---

<div align="center">

**[⬆ 回到顶部](#-eduflow---智能学习助手)**

Made with ❤️ by CTO Team

</div>

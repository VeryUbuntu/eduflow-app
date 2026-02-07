# Eduflow 快速参考手册

## 🚀 一行命令

```bash
# VPS 上一键部署
cd /var/www/eduflow-app && chmod +x deploy/deploy.sh && sudo ./deploy/deploy.sh

# 更新应用
cd /var/www/eduflow-app && git pull && npm run build && pm2 restart all

# 查看所有日志
pm2 logs

# 重启所有服务
pm2 restart all

# 备份数据库
bash /var/www/eduflow-app/deploy/backup.sh
```

## 📁 项目结构

```
eduflow-app/
├── app/                    # Next.js 前端页面
│   ├── page.tsx           # 主页面（日历、知识卡片）
│   ├── login/             # 登录页
│   └── register/          # 注册页
├── api/                    # Python FastAPI 后端
│   ├── main.py            # 主 API 服务
│   ├── models.py          # 数据库模型
│   ├── requirements.txt   # Python 依赖
│   ├── .env               # 后端环境变量 (API keys)
│   └── eduflow.db         # SQLite 数据库
├── components/             # React 组件
├── deploy/                 # 部署脚本和配置
│   ├── deploy.sh          # 一键部署脚本
│   ├── nginx.conf         # Nginx 配置
│   ├── pre-deploy-check.sh # 部署前检查
│   ├── backup.sh          # 数据库备份脚本
│   └── HEALTH_CHECK.md    # 健康检查指南
├── ecosystem.config.js     # PM2 配置
├── next.config.mjs         # Next.js 配置
├── package.json            # Node.js 依赖
├── DEPLOYMENT.md           # 详细部署文档
└── DEPLOYMENT_PLAN.md      # 部署计划
```

## 🔑 关键文件和配置

### 环境变量

**前端** (`.env.production`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # 后端 API 地址
```

**后端** (`api/.env`):
```env
LLM_API_KEY=sk-xxx                         # AI API 密钥
LLM_BASE_URL=https://api.siliconflow.cn/v1 # AI API 基础 URL
SECRET_KEY=your-secure-random-string        # JWT 密钥
```

### 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 (Next.js) | 3000 | 用户界面 |
| 后端 (FastAPI) | 8000 | API 服务 |
| Nginx | 80 | HTTP |
| Nginx | 443 | HTTPS |

## 📝 常用命令

### PM2 进程管理

```bash
pm2 start ecosystem.config.js   # 启动所有服务
pm2 stop all                     # 停止所有服务
pm2 restart all                  # 重启所有服务
pm2 delete all                   # 删除所有服务
pm2 status                       # 查看状态
pm2 logs                         # 查看日志
pm2 logs eduflow-backend         # 查看后端日志
pm2 logs eduflow-frontend        # 查看前端日志
pm2 monit                        # 监控面板
pm2 save                         # 保存配置
pm2 resurrect                    # 恢复配置
```

### Nginx 管理

```bash
sudo systemctl start nginx       # 启动 Nginx
sudo systemctl stop nginx        # 停止 Nginx
sudo systemctl restart nginx     # 重启 Nginx
sudo systemctl reload nginx      # 重新加载配置
sudo systemctl status nginx      # 查看状态
sudo nginx -t                    # 测试配置
sudo tail -f /var/log/nginx/error.log  # 查看错误日志
```

### SSL 证书管理

```bash
sudo certbot certificates                      # 查看证书
sudo certbot renew                             # 手动续期
sudo certbot renew --dry-run                   # 测试续期
sudo systemctl status certbot.timer            # 查看自动续期状态
```

### Git 操作

```bash
git status                       # 查看状态
git pull origin main             # 拉取最新代码
git log --oneline -10            # 查看最近 10 次提交
git diff                         # 查看修改
```

### 数据库操作

```bash
# 备份数据库
cp api/eduflow.db api/backup/eduflow_$(date +%Y%m%d).db

# 查看数据库大小
ls -lh api/eduflow.db

# 使用 SQLite CLI
cd api && sqlite3 eduflow.db
# > .tables              # 查看所有表
# > SELECT * FROM users; # 查询用户
# > .quit                # 退出
```

### 系统监控

```bash
top                              # CPU 和内存监控
htop                             # 增强版 top（需安装）
df -h                            # 磁盘使用
free -h                          # 内存使用
sudo netstat -tlnp               # 端口监听
ps aux | grep node               # 查看 Node.js 进程
ps aux | grep python             # 查看 Python 进程
```

## 🐛 快速问题排查

### 问题：网站无法访问

```bash
# 1. 检查服务是否运行
pm2 status

# 2. 检查 Nginx
sudo systemctl status nginx

# 3. 检查防火墙
sudo ufw status

# 4. 查看日志
pm2 logs --lines 50
sudo tail -50 /var/log/nginx/error.log
```

### 问题：API 返回 502

```bash
# 1. 检查后端进程
pm2 status eduflow-backend

# 2. 查看后端日志
pm2 logs eduflow-backend --lines 100

# 3. 检查端口
sudo netstat -tlnp | grep 8000

# 4. 重启后端
pm2 restart eduflow-backend
```

### 问题：前端白屏

```bash
# 1. 检查前端进程
pm2 status eduflow-frontend

# 2. 查看前端日志
pm2 logs eduflow-frontend --lines 100

# 3. 检查构建
ls -la .next

# 4. 重新构建
npm run build
pm2 restart eduflow-frontend
```

### 问题：SSL 证书错误

```bash
# 1. 检查证书
sudo certbot certificates

# 2. 检查证书文件
sudo ls -l /etc/letsencrypt/live/your-domain.com/

# 3. 手动续期
sudo certbot renew --force-renewal

# 4. 重启 Nginx
sudo systemctl restart nginx
```

## ⚡ 性能优化建议

### 1. 启用缓存

在 `api/main.py` 中添加缓存：

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_operation(param):
    # 耗时操作
    pass
```

### 2. 数据库优化

```bash
# 定期优化数据库
cd api
sqlite3 eduflow.db "VACUUM;"
```

### 3. 前端优化

```bash
# 分析打包大小
npm run build

# 查看输出中的页面大小，优化较大的页面
```

### 4. Nginx 优化

已在配置中启用：
- ✅ Gzip 压缩
- ✅ HTTP/2
- ✅ Keep-alive
- ⚠️ 可考虑添加缓存头部

## 🔒 安全检查清单

- [ ] API Keys 不在代码中硬编码
- [ ] `.env` 文件在 `.gitignore` 中
- [ ] SSH 使用密钥登录
- [ ] 防火墙只开放必要端口
- [ ] SSL 证书有效且自动续期
- [ ] SECRET_KEY 使用随机强密码
- [ ] 数据库定期备份
- [ ] 日志定期清理
- [ ] 系统定期更新

## 📊 监控指标

### 需要监控的指标

1. **可用性**
   - 前端响应时间
   - 后端 API 响应时间
   - SSL 证书有效期

2. **性能**
   - CPU 使用率
   - 内存使用率
   - 磁盘使用率
   - 网络带宽

3. **错误**
   - 应用错误日志
   - Nginx 错误日志
   - PM2 进程崩溃

4. **业务指标**
   - 每日活跃用户
   - API 调用次数
   - 知识卡片生成次数

### 推荐监控工具

- **UptimeRobot**: 网站可用性监控（免费）
- **PM2 Plus**: 进程监控和管理
- **Sentry**: 错误追踪
- **Prometheus + Grafana**: 系统指标监控

## 🔄 定期维护任务

### 每日

```bash
# 检查服务状态
pm2 status

# 查看错误日志
pm2 logs --err --lines 20
```

### 每周

```bash
# 备份数据库
bash deploy/backup.sh

# 检查磁盘空间
df -h

# 清理旧日志
pm2 flush
```

### 每月

```bash
# 更新系统包
sudo apt-get update && sudo apt-get upgrade -y

# 检查 SSL 证书
sudo certbot certificates

# 审查访问日志
sudo tail -1000 /var/log/nginx/access.log | grep -v "200"
```

## 📞 紧急联系方式

- **服务器托管商**: [联系方式]
- **域名注册商**: [联系方式]
- **技术支持**: [联系方式]

## 📚 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署指南
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) - 部署计划
- [deploy/HEALTH_CHECK.md](./deploy/HEALTH_CHECK.md) - 健康检查
- [Next.js 文档](https://nextjs.org/docs)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Nginx 文档](https://nginx.org/en/docs/)

---

**版本**: 1.0
**最后更新**: 2026-02-07

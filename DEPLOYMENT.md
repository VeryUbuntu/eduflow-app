# Eduflow - 生产环境部署指南

## 📋 目录
1. [环境要求](#环境要求)
2. [快速部署](#快速部署)
3. [手动部署](#手动部署)
4. [SSL 证书配置](#ssl-证书配置)
5. [常见问题](#常见问题)
6. [维护与监控](#维护与监控)

---

## 🎯 环境要求

### 服务器配置
- **操作系统**: Ubuntu 20.04+ / Debian 11+
- **CPU**: 2核心及以上
- **内存**: 2GB RAM 最低，4GB 推荐
- **硬盘**: 20GB 可用空间
- **网络**: 公网 IP 地址

### 软件要求
- Node.js 18+ 
- Python 3.9+
- Nginx
- PM2
- Git

### 域名要求
- 已注册的域名
- DNS 解析到服务器 IP
- 电子邮箱（用于 SSL 证书）

---

## 🚀 快速部署（推荐）

### 第一步：准备 VPS

1. **登录 VPS**
   ```bash
   ssh root@your-server-ip
   ```

2. **克隆项目**
   ```bash
   cd /var/www
   git clone https://github.com/your-repo/eduflow-app.git
   cd eduflow-app
   ```

3. **配置域名信息**
   编辑部署脚本：
   ```bash
   nano deploy/deploy.sh
   ```
   
   修改以下配置：
   ```bash
   DOMAIN="your-domain.com"          # 你的域名
   EMAIL="your-email@example.com"    # 你的邮箱
   ```

4. **运行一键部署脚本**
   ```bash
   chmod +x deploy/deploy.sh
   sudo ./deploy/deploy.sh
   ```

5. **配置 API 密钥**
   部署完成后，编辑后端环境变量：
   ```bash
   nano /var/www/eduflow-app/api/.env
   ```
   
   填入你的实际 API 密钥：
   ```env
   LLM_API_KEY=your-actual-api-key-here
   LLM_BASE_URL=https://api.siliconflow.cn/v1
   SECRET_KEY=your-secure-random-string-here
   ```

6. **重启服务**
   ```bash
   pm2 restart all
   ```

7. **验证部署**
   访问：`https://your-domain.com`

---

## 🔧 手动部署

如果自动脚本失败，可以按照以下步骤手动部署：

### 1. 安装系统依赖

```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装必要软件
sudo apt-get install -y curl git build-essential python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

### 2. 配置后端 (FastAPI)

```bash
cd /var/www/eduflow-app/api

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 创建 .env 文件
cat > .env << 'EOF'
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.siliconflow.cn/v1
SECRET_KEY=$(openssl rand -hex 32)
EOF

# 初始化数据库
python3 -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"

deactivate
```

### 3. 配置前端 (Next.js)

```bash
cd /var/www/eduflow-app

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 4. 使用 PM2 启动服务

```bash
cd /var/www/eduflow-app

# 使用配置文件启动
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启动
pm2 startup
# 执行上面命令输出的命令
```

### 5. 配置 Nginx

```bash
# 创建日志目录
sudo mkdir -p /var/www/eduflow-app/logs

# 复制 Nginx 配置
sudo cp deploy/nginx.conf /etc/nginx/sites-available/eduflow

# 修改域名
sudo nano /etc/nginx/sites-available/eduflow
# 将 your-domain.com 替换为你的实际域名

# 启用站点
sudo ln -sf /etc/nginx/sites-available/eduflow /etc/nginx/sites-enabled/

# 删除默认站点（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔒 SSL 证书配置

### 方法一：使用 Let's Encrypt（免费，推荐）

**前提条件：**
- 域名已正确解析到服务器 IP
- Nginx 已正确配置
- 端口 80 和 443 已开放

**执行以下命令：**

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 自动配置 SSL（推荐）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 或者只获取证书
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

**设置自动续期：**

```bash
# 测试续期
sudo certbot renew --dry-run

# 查看续期定时任务
sudo systemctl status certbot.timer
```

证书将自动在到期前续期。

### 方法二：使用 acme.sh（备选）

```bash
# 安装 acme.sh
curl https://get.acme.sh | sh

# 获取证书
~/.acme.sh/acme.sh --issue -d your-domain.com -d www.your-domain.com --nginx

# 安装证书到 Nginx
~/.acme.sh/acme.sh --install-cert -d your-domain.com \
  --key-file /etc/nginx/ssl/your-domain.com.key \
  --fullchain-file /etc/nginx/ssl/your-domain.com.crt \
  --reloadcmd "systemctl reload nginx"
```

### 方法三：使用已有证书

如果你已经有 SSL 证书：

1. 上传证书文件到服务器：
   ```bash
   /etc/nginx/ssl/your-domain.com.crt
   /etc/nginx/ssl/your-domain.com.key
   ```

2. 修改 Nginx 配置中的证书路径：
   ```nginx
   ssl_certificate /etc/nginx/ssl/your-domain.com.crt;
   ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;
   ```

3. 重启 Nginx：
   ```bash
   sudo systemctl restart nginx
   ```

---

## 🔥 防火墙配置

```bash
# 启用 UFW
sudo ufw enable

# 允许 SSH（重要！）
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 检查状态
sudo ufw status
```

---

## ❓ 常见问题

### 1. 服务启动失败

**问题**: PM2 启动后立即退出

**解决方案**:
```bash
# 查看详细日志
pm2 logs eduflow-backend --lines 100
pm2 logs eduflow-frontend --lines 100

# 检查构建是否成功
cd /var/www/eduflow-app
ls -la .next

# 重新构建
npm run build

# 重启服务
pm2 restart all
```

### 2. 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 查找占用端口的进程
sudo lsof -i :3000
sudo lsof -i :8000

# 终止进程
sudo kill -9 <PID>

# 或者修改端口
# 编辑 ecosystem.config.js 修改端口号
```

### 3. Nginx 502 Bad Gateway

**问题**: 访问网站显示 502 错误

**解决方案**:
```bash
# 检查后端服务是否运行
pm2 status

# 检查端口监听
sudo netstat -tlnp | grep 3000
sudo netstat -tlnp | grep 8000

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重启所有服务
pm2 restart all
sudo systemctl restart nginx
```

### 4. SSL 证书获取失败

**问题**: Certbot 无法获取证书

**解决方案**:
```bash
# 检查域名解析
ping your-domain.com
nslookup your-domain.com

# 检查防火墙
sudo ufw status

# 检查 Nginx 配置
sudo nginx -t

# 使用 HTTP 挑战
sudo certbot certonly --standalone -d your-domain.com
```

### 5. 数据库错误

**问题**: `OperationalError: unable to open database file`

**解决方案**:
```bash
# 检查数据库文件权限
cd /var/www/eduflow-app/api
ls -l eduflow.db

# 修复权限
sudo chown www-data:www-data eduflow.db
sudo chmod 664 eduflow.db

# 重新初始化数据库
source venv/bin/activate
python3 -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 6. API Key 配置问题

**问题**: AI 功能无法使用

**解决方案**:
```bash
# 检查环境变量
cd /var/www/eduflow-app/api
cat .env

# 确保 API Key 正确
nano .env

# 重启后端服务
pm2 restart eduflow-backend

# 查看日志
pm2 logs eduflow-backend
```

---

## 📊 维护与监控

### 日常维护命令

```bash
# 查看所有服务状态
pm2 status

# 查看实时日志
pm2 logs

# 查看特定服务日志
pm2 logs eduflow-backend
pm2 logs eduflow-frontend

# 监控资源使用
pm2 monit

# 重启服务
pm2 restart all
pm2 restart eduflow-backend
pm2 restart eduflow-frontend

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all
```

### 更新部署

```bash
# 进入项目目录
cd /var/www/eduflow-app

# 拉取最新代码
git pull origin main

# 更新后端
cd api
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 更新前端
cd ..
npm install
npm run build

# 重启服务
pm2 restart all
```

### 数据库备份

```bash
# 手动备份
cp /var/www/eduflow-app/api/eduflow.db /var/www/eduflow-app/api/backup/eduflow_$(date +%Y%m%d).db

# 设置定时备份
crontab -e

# 添加以下行（每天凌晨 2 点备份）
0 2 * * * cp /var/www/eduflow-app/api/eduflow.db /var/www/eduflow-app/api/backup/eduflow_$(date +\%Y\%m\%d).db
```

### 日志管理

```bash
# PM2 日志
pm2 logs --lines 100

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 清理旧日志
pm2 flush
```

### 性能优化

```bash
# 检查内存使用
free -h

# 检查磁盘使用
df -h

# 清理 npm 缓存
npm cache clean --force

# 清理 pip 缓存
pip cache purge
```

---

## 🎉 部署检查清单

部署完成后，请检查以下项目：

- [ ] 前端可以通过 HTTPS 访问
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 创建学习者功能正常
- [ ] 日历加载正常
- [ ] 点击日期能生成知识卡片
- [ ] AI 解释功能正常
- [ ] 目标设置功能正常
- [ ] SSL 证书有效
- [ ] PM2 开机自启动已配置
- [ ] 防火墙已正确配置
- [ ] 数据库备份策略已设置
- [ ] 日志轮转已配置

---

## 📞 支持

如有问题，请查看日志文件：
- PM2 后端日志: `/var/www/eduflow-app/logs/backend-error.log`
- PM2 前端日志: `/var/www/eduflow-app/logs/frontend-error.log`
- Nginx 日志: `/var/log/nginx/error.log`

---

**最后更新**: 2026-02-07
**维护者**: CTO

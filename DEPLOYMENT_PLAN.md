# Eduflow 项目部署计划

## ✅ 问题 1: 项目能否正确运行？

### 已识别的问题和解决方案

#### 🔧 **已修复的问题**

1. **硬编码的后端地址** ✅
   - **问题**: `next.config.mjs` 中硬编码 `127.0.0.1:8000`
   - **修复**: 改用环境变量 `NEXT_PUBLIC_API_URL`
   - **文件**: `next.config.mjs`

2. **缺少生产环境配置** ✅
   - **问题**: 没有生产环境的环境变量配置
   - **修复**: 创建 `.env.production` 模板
   - **文件**: `.env.production`

3. **PM2 配置不完整** ✅
   - **问题**: 原配置只管理前端
   - **修复**: 更新为同时管理前后端，包含日志配置
   - **文件**: `ecosystem.config.js`

#### ⚠️ **需要注意的问题**

1. **敏感信息暴露**
   - **位置**: `api/.env` 文件中包含 API Key
   - **建议**: 
     - 将 `api/.env` 加入 `.gitignore`
     - 使用密钥管理服务（如 AWS Secrets Manager）
     - 在 VPS 上手动配置环境变量

2. **SQLite 数据库限制**
   - **问题**: SQLite 不适合高并发场景
   - **建议**: 
     - 初期使用 SQLite 启动项目
     - 用户增长后迁移到 PostgreSQL/MySQL
     - 定期备份数据库文件

3. **CORS 配置**
   - **状态**: 当前未在 `main.py` 中看到 CORS 配置
   - **建议**: 如果前后端分离部署，需要配置 CORS

### 运行前的检查清单

运行以下命令进行部署前检查：

```bash
cd /path/to/eduflow-app
chmod +x deploy/pre-deploy-check.sh
./deploy/pre-deploy-check.sh
```

---

## ✅ 问题 2: 如何在 VPS 上运行？

### 部署方式

#### **方式一：一键自动部署（推荐新手）**

```bash
# 1. SSH 登录 VPS
ssh root@your-vps-ip

# 2. 克隆项目
cd /var/www
git clone https://github.com/your-repo/eduflow-app.git
cd eduflow-app

# 3. 编辑部署配置
nano deploy/deploy.sh
# 修改 DOMAIN 和 EMAIL

# 4. 运行部署脚本
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh

# 5. 配置 API Key
nano /var/www/eduflow-app/api/.env
# 填入实际的 LLM_API_KEY 和安全的 SECRET_KEY

# 6. 重启服务
pm2 restart all
```

**优点**:
- 全自动化，适合快速部署
- 包含所有必要的系统配置
- 自动配置 SSL 证书

**缺点**:
- 需要 root 权限
- 所有步骤一次性执行，出错时难以定位

#### **方式二：分步手动部署（推荐有经验者）**

详细步骤请参考 `DEPLOYMENT.md` 的"手动部署"部分。

**优点**:
- 可以逐步验证每个步骤
- 出错时容易定位和修复
- 更好地理解部署过程

**缺点**:
- 步骤较多，耗时较长

### 推荐的 VPS 配置

| 配置项 | 最低配置 | 推荐配置 | 高性能配置 |
|--------|----------|----------|------------|
| CPU | 1 核心 | 2 核心 | 4 核心 |
| 内存 | 1GB | 2GB | 4GB+ |
| 硬盘 | 20GB | 40GB | 80GB+ |
| 带宽 | 1Mbps | 5Mbps | 10Mbps+ |
| 预估用户 | <50 | <500 | <5000 |

### 推荐 VPS 服务商

- **国外**: 
  - AWS Lightsail ($5/月起)
  - DigitalOcean ($6/月起)
  - Linode ($5/月起)
  - Vultr ($5/月起)

- **国内**:
  - 阿里云
  - 腾讯云
  - 华为云

---

## ✅ 问题 3: 域名解析和 SSL 证书

### 3.1 域名 DNS 配置

#### **步骤 1: 获取 VPS IP 地址**

```bash
# 在 VPS 上运行
curl ifconfig.me
```

#### **步骤 2: 配置 DNS 记录**

登录你的域名注册商（如阿里云、GoDaddy、Cloudflare），添加以下 DNS 记录：

| 类型 | 主机记录 | 记录值 | TTL |
|------|----------|--------|-----|
| A | @ | your-vps-ip | 600 |
| A | www | your-vps-ip | 600 |
| CNAME | www | your-domain.com | 600 |

**示例**（假设域名为 `eduflow.com`，VPS IP 为 `123.45.67.89`）：

```
A     @     123.45.67.89     600
A     www   123.45.67.89     600
```

#### **步骤 3: 验证 DNS 解析**

等待 5-10 分钟后，验证解析是否生效：

```bash
# 在本地电脑运行
ping your-domain.com
nslookup your-domain.com
```

### 3.2 SSL 证书申请

#### **方式一：Let's Encrypt 自动化（推荐）**

部署脚本会自动配置，或者手动运行：

```bash
# 确保域名已解析到服务器
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

**优点**:
- 完全免费
- 自动续期
- 浏览器信任
- 配置简单

**有效期**: 90 天（自动续期）

#### **方式二：Cloudflare SSL（免费）**

1. 将域名 DNS 托管到 Cloudflare
2. 在 Cloudflare 控制台启用 SSL
3. 生成 Origin 证书
4. 在 Nginx 中配置证书

**优点**:
- 完全免费
- 自动续期
- 额外的 CDN 加速
- DDoS 防护

**设置步骤**:

1. 登录 Cloudflare，添加域名
2. 更改域名的 Nameserver 到 Cloudflare 提供的地址
3. SSL/TLS → Overview → 选择 "Full (strict)"
4. SSL/TLS → Origin Server → Create Certificate
5. 下载证书和私钥
6. 上传到服务器并配置 Nginx

#### **方式三：购买商业证书**

适合企业级应用，需要 EV 证书或通配符证书的场景。

**证书商**:
- DigiCert
- Sectigo
- GeoTrust

**价格**: $50 - $500 /年

### 3.3 HTTPS 强制跳转

确保 Nginx 配置中包含：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3.4 SSL 测试

部署完成后，访问以下网站测试 SSL 配置：

- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

**目标评级**: A 或 A+

---

## 🔒 安全加固建议

1. **修改 SSH 端口**
   ```bash
   nano /etc/ssh/sshd_config
   # Port 2222
   systemctl restart sshd
   ```

2. **使用密钥登录，禁用密码**
   ```bash
   # 禁用密码登录
   nano /etc/ssh/sshd_config
   # PasswordAuthentication no
   ```

3. **配置 Fail2Ban**
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **定期更新系统**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

5. **设置数据库定时备份**
   ```bash
   # 添加到 crontab
   0 2 * * * /var/www/eduflow-app/deploy/backup.sh
   ```

---

## 📊 部署后验证

部署完成后，请验证以下功能：

```bash
# 1. 检查服务状态
pm2 status

# 2. 查看日志
pm2 logs --lines 50

# 3. 测试后端 API
curl https://your-domain.com/api/users

# 4. 检查 SSL 证书
curl -vI https://your-domain.com 2>&1 | grep -i subject

# 5. 检查防火墙
sudo ufw status
```

**前端测试清单**:
- [ ] HTTPS 访问正常
- [ ] 注册新账号
- [ ] 登录功能
- [ ] 创建学习者
- [ ] 选择科目
- [ ] 查看日历
- [ ] 生成知识卡片
- [ ] AI 解释功能
- [ ] 设置学习目标

---

## 📞 支持与维护

### 常用维护命令

```bash
# 查看服务状态
pm2 status

# 重启所有服务
pm2 restart all

# 查看日志
pm2 logs

# 更新代码
cd /var/www/eduflow-app
git pull origin main
npm run build
pm2 restart all

# 数据库备份
cp api/eduflow.db api/backup/eduflow_$(date +%Y%m%d).db
```

### 监控和告警

建议设置以下监控：

1. **服务器监控**: 使用 PM2 Plus 或 Datadog
2. **网站监控**: 使用 UptimeRobot 或 Pingdom
3. **日志聚合**: 使用 ELK Stack 或 Loki
4. **错误追踪**: 使用 Sentry

---

**部署文档版本**: 1.0
**最后更新**: 2026-02-07
**维护者**: CTO Team

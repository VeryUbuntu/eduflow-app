# Eduflow 生产环境健康检查

## 快速检查

在 VPS 上运行此命令快速检查所有服务状态：

```bash
curl -s https://your-domain.com/api/health || echo "Backend: ❌ 离线"
curl -s https://your-domain.com || echo "Frontend: ❌ 离线"  
pm2 status
```

## 完整健康检查清单

### 1. 服务运行状态

```bash
# PM2 服务状态
pm2 status

# 预期输出：
# eduflow-backend  | online
# eduflow-frontend | online
```

### 2. 端口监听检查

```bash
# 检查后端端口
sudo netstat -tlnp | grep 8000

# 检查前端端口
sudo netstat -tlnp | grep 3000

# 检查 Nginx 端口
sudo netstat -tlnp | grep 80
sudo netstat -tlnp | grep 443
```

### 3. Nginx 状态

```bash
sudo systemctl status nginx
# 预期: active (running)

sudo nginx -t
# 预期: syntax is ok, test is successful
```

### 4. SSL 证书检查

```bash
# 检查证书有效期
sudo certbot certificates

# 测试续期（dry run）
sudo certbot renew --dry-run
```

### 5. 磁盘空间

```bash
df -h /

# 警告阈值: > 80% 使用率
# 危险阈值: > 90% 使用率
```

### 6. 内存使用

```bash
free -h

# 如果 available 内存 < 200MB，考虑增加内存或优化
```

### 7. 数据库检查

```bash
# 检查数据库文件
ls -lh /var/www/eduflow-app/api/eduflow.db

# 检查最近备份
ls -lht /var/www/eduflow-app/api/backup/ | head -5
```

### 8. 日志错误检查

```bash
# 检查后端错误
pm2 logs eduflow-backend --lines 50 --err

# 检查前端错误
pm2 logs eduflow-frontend --lines 50 --err

# 检查 Nginx 错误
sudo tail -50 /var/log/nginx/error.log
```

### 9. API 功能测试

```bash
# 测试后端 API（替换为你的域名）
curl https://your-domain.com/api/users

# 预期: 返回 JSON 或认证错误（证明 API 在工作）
```

### 10. 防火墙状态

```bash
sudo ufw status

# 预期:
# 22/tcp    ALLOW
# 80/tcp    ALLOW  
# 443/tcp   ALLOW
```

## 性能监控

### CPU 和内存监控

```bash
# 实时监控
pm2 monit

# 或者使用 top
top
# 按 'P' 按 CPU 排序
# 按 'M' 按内存排序
```

### 响应时间测试

```bash
# 测试首页加载时间
time curl -s https://your-domain.com > /dev/null

# 测试 API 响应时间
time curl -s https://your-domain.com/api/health > /dev/null
```

### 并发测试

使用 Apache Bench (ab) 进行简单压力测试：

```bash
# 安装 ab
sudo apt-get install apache2-utils

# 100 个请求，10 个并发
ab -n 100 -c 10 https://your-domain.com/
```

## 告警阈值建议

| 指标 | 警告 | 严重 | 处理建议 |
|------|------|------|----------|
| CPU 使用率 | > 70% | > 90% | 优化代码或升级服务器 |
| 内存使用率 | > 75% | > 90% | 检查内存泄漏或增加内存 |
| 磁盘使用率 | > 80% | > 90% | 清理日志和备份 |
| 响应时间 | > 2s | > 5s | 优化查询或增加缓存 |
| 错误率 | > 1% | > 5% | 检查日志并修复 |
| SSL 证书过期 | < 30天 | < 7天 | 手动续期证书 |

## 自动化监控脚本

创建 `health-check.sh`：

```bash
#!/bin/bash
# 定时运行此脚本，出现问题时发送告警

DOMAIN="your-domain.com"
EMAIL="admin@example.com"
ERRORS=""

# 检查前端
if ! curl -sf https://$DOMAIN > /dev/null; then
    ERRORS+="Frontend is down!\n"
fi

# 检查后端
if ! curl -sf https://$DOMAIN/api/health > /dev/null; then
    ERRORS+="Backend API is down!\n"
fi

# 检查证书（30天内过期）
CERT_DAYS=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -checkend 2592000)
if [ $? -ne 0 ]; then
    ERRORS+="SSL certificate expires in < 30 days!\n"
fi

# 发送告警
if [ -n "$ERRORS" ]; then
    echo -e "$ERRORS" | mail -s "Eduflow Health Check FAILED" $EMAIL
    exit 1
fi

exit 0
```

添加到 crontab（每 5 分钟检查一次）：

```bash
crontab -e

# 添加：
*/5 * * * * /var/www/eduflow-app/deploy/health-check.sh
```

## 常见问题诊断

### 问题: 502 Bad Gateway

```bash
# 1. 检查后端是否运行
pm2 status

# 2. 检查后端日志
pm2 logs eduflow-backend --lines 100

# 3. 重启后端
pm2 restart eduflow-backend
```

### 问题: 页面加载慢

```bash
# 1. 检查服务器负载
top

# 2. 检查网络延迟
ping -c 5 your-domain.com

# 3. 检查数据库大小
ls -lh api/eduflow.db

# 4. 优化建议：
# - 启用 Nginx Gzip 压缩（已在配置中）
# - 添加 Redis 缓存
# - 优化数据库查询
```

### 问题: 内存不足

```bash
# 1. 查看内存使用
free -h

# 2. 查看最耗内存的进程
ps aux --sort=-%mem | head -10

# 3. 重启服务释放内存
pm2 restart all

# 4. 考虑添加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

**最后更新**: 2026-02-07

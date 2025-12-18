# 部署指南 (Deployment Guide)

本项目包含两部分：
1.  **前端 (Frontend)**: 基于 Next.js (React)
2.  **后端 (Backend)**: 基于 Python FastAPI

如果您想将此服务部署到外部服务器（如阿里云、腾讯云或 AWS 的 Linux 服务器），请按照以下步骤操作。

---

## 1. 准备工作

确保您的服务器已安装以下软件：
*   **Node.js** (v18 或更高)
*   **Python** (v3.9 或更高)
*   **Git**
*   **Nginx** (作为反向代理)
*   **PM2** (用于进程守护，强烈推荐) `npm install pm2 -g`

---

## 2. 获取代码

在服务器上克隆您的代码仓库：

```bash
git clone <您的GitHub仓库地址>
cd eduflow-app
```

---

## 3. 部署后端 (FastAPI)

后端运行在 `8000` 端口。

1.  **进入 API 目录**:
    ```bash
    cd api
    ```

2.  **创建虚拟环境并安装依赖**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install uvicorn gunicorn python-dotenv
    ```
    *(注意：如果没有 `requirements.txt`，请先在使用 `pip freeze > requirements.txt` 生成或手动安装 `fastapi uvicorn sqlalchemy python-dotenv openai`)*

3.  **配置环境变量**:
    创建 `.env` 文件并填入您的 API Key：
    ```bash
    nano .env
    ```
    内容：
    ```properties
    LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
    LLM_BASE_URL=https://api.siliconflow.cn/v1
    ```

4.  **启动后端服务 (使用 PM2)**:
    回到项目根目录，使用 PM2 启动 Python 服务：
    ```bash
    pm2 start "cd api && venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000" --name "eduflow-api"
    ```

---

## 4. 部署前端 (Next.js)

前端运行在 `3000` 端口。

1.  **安装依赖**:
    ```bash
    cd .. # 回到 eduflow-app 根目录
    npm install
    ```

2.  **构建生产版本**:
    ```bash
    npm run build
    ```

3.  **启动前端服务 (使用 PM2)**:
    ```bash
    pm2 start "npm start" --name "eduflow-web"
    ```

此时，您的服务已经在运行了：
*   前端: `http://localhost:3000`
*   后端: `http://localhost:8000`

---

## 5. 配置 Nginx 反向代理 (推荐)

为了让用户通过域名（如 `www.example.com`）访问，而不是 `IP:3000`，需要配置 Nginx。

1.  **编辑 Nginx 配置文件**:
    ```bash
    sudo nano /etc/nginx/sites-available/eduflow
    ```

2.  **填入配置**:
    ```nginx
    server {
        listen 80;
        server_name www.your-domain.com; # 您的域名或服务器IP

        # 前端页面
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # 后端 API 转发
        location /api/ {
            proxy_pass http://localhost:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **启用配置并重启 Nginx**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/eduflow /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## 6. 常见维护命令

*   **查看服务状态**: `pm2 status`
*   **查看日志**: `pm2 logs`
*   **重启所有服务**: `pm2 restart all`
*   **代码更新**:
    1.  `git pull`
    2.  后端更新依赖（如果有）: `cd api && pip install ...`
    3.  前端重新构建: `npm run build`
    4.  `pm2 restart all`

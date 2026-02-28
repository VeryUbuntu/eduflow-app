# 部署指南 (Deployment Guide) - 联合门户版

> **注意：Eduflow 核心应用现已全栈整合至 `sxu.com` 主门户中。此文档为大一统架构下的最新部署指南。**

本项目采用混合技术栈，包含两部分实体进程：
1.  **统一前端门户 (SXU Web)**: 基于 Next.js (包含原主站应用与 Eduflow 模块)
2.  **核心智能引擎 (Eduflow API)**: 基于 Python FastAPI (专职提供大模型流式生成、知识图谱解析等高密集计算)

如果您想将此服务更新或重新部署到服务器，请按照以下步骤操作。

---

## 1. 架构总览与机制说明

*   **进程分离，视图统一**：前端所有路由交由 Next.js 接管（PM2: `sxu-web`），Eduflow 界面位于 `/eduflow` 路由下。
*   **同域穿透，无惧跨域**：前端产生的 `/eduflow/api/` 请求，会由 Next.js 底层的 `next.config.ts` 内部代理，直接打给本地守护的 `8005` 端口（PM2: `eduflow-api`）。
*   **SSO 终极闭环**：由于都在同一个 Next.js 原生环境下，sxu.com 下发的 Supabase 分块 Cookie 能够被 Eduflow 完美继承解码，彻底消灭了需要反复跳转授权的痛点。

---

## 2. 准备工作

确保您的服务器已安装以下基础环境：
*   **Node.js** (v18 或更高)
*   **Python** (v3.9 或更高)
*   **PM2** (用于进程守护，强烈推荐) `npm install pm2 -g`
*   **Nginx** (用于暴露 80/443 Web 端口)

---

## 3. 获取更新与拉取代码

在服务器上进入您的主工程目录（通常是 `sxu.com`）：

```bash
cd /var/www/sxu.com
git pull origin main
```

*(原孤立存在的 `eduflow-app` 仓可作为历史遗迹归档废弃)*

---

## 4. 部署后端计算引擎 (FastAPI)

后端引擎专职负责硅基流动 (SiliconFlow) 的大模型并发调度，固定运行在本地保留端口 `8005` 上。

1.  **进入内嵌的 API 目录并建置虚拟环境**:
    ```bash
    cd api
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

2.  **配置智能引擎环境变量**:
    该目录下必须存在 `.env` 文件以承载私密密钥及身份签章。
    ```bash
    nano .env
    ```
    必需包含：
    ```properties
    LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
    LLM_BASE_URL=https://api.siliconflow.cn/v1
    
    # 至关重要：必须是从 Supabase 提取的真实 JWT Secret，用于解码前端传来的身份 Cookie
    SUPABASE_JWT_SECRET=your-real-jwt-secret-here
    ```

3.  **启动后端引擎进程 (PM2)**:
    回到项目根目录启动，或在 api 目录下启动。
    ```bash
    # 假设目前在 /var/www/sxu.com 下
    pm2 start "cd api && venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8005" --name "eduflow-api"
    ```

---

## 5. 部署统一主门户 (Next.js)

统一门户承载了整个大站的流量入口，包含 Eduflow 原有所有视图框架。

1.  **安装新进融合的组件依赖库**:
    ```bash
    cd /var/www/sxu.com
    npm install
    ```

2.  **构建全站静态产物 (含最新的 Eduflow 页面)**:
    ```bash
    npm run build
    ```

3.  **启动主门户进程 (以通常的 3001 端口为例)**:
    ```bash
    pm2 start "npm start -- -p 3001" --name "sxu-web"
    ```

---

## 6. Nginx 最优反向代理配置

在大一统架构下，Nginx 的核心任务被极度简化：只需要将外界所有的 80/443 流量全部砸向 Node.js 即可。不再需要为 Eduflow 编写极其复杂的跨端口重定向跳转。

配置文件类似如下（以 `/etc/nginx/sites-available/sxu-portal` 为例）：

```nginx
server {
    listen 80;
    server_name www.your-domain.com; # 您的公网IP或域名

    # ==========================================
    # 🌟 主力门户：SXU.com (Next.js) 全栈接管
    # ==========================================
    location / {
        proxy_pass http://127.0.0.1:3001; 
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # ==========================================
    # 🧪 原生外挂组件：交互式元素周期表 (纯前端独立系统)
    # ==========================================
    location = /periodic {
        return 301 /periodic/;
    }
    location ^~ /periodic/ {
        alias /var/www/periodic/;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```

启用并重载 Nginx 以生效：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. 常见维护排障指南

*   **前端修改生效**:
    ```bash
    git pull && npm run build && pm2 restart sxu-web
    ```
*   **后端模型/验证逻辑修改生效**:
    ```bash
    git pull && pm2 restart eduflow-api
    ```
*   **如何观察大模型并发日志**:
    ```bash
    pm2 logs eduflow-api
    ```
*   **出现无限登录跳转死循环（Too Many Redirects）或登录后状态丢失怎么排查？**
    1. 检查环境变量：确保 `sxu.com` 工程的根目录有正确的 `.env.local` 且 Supabase Keys 正确。
    2. 检查 `api/.env` 里的 `SUPABASE_JWT_SECRET` 是否正确同步（这决定了挂在 8005 的 Python 敢不敢相信前端的发来的用户数据）。
    3. 检查有没有误用老版的遗留端口。

# Eduflow 与 SXU.com 的单点登录 (SSO) 整合方案

## 架构愿景
**核心策略**：废弃 Eduflow 本地的 SQLite 账号验证体系，全面拥抱 `sxu.com` 部署的 **Supabase 统一身份认证中心**。让 Supabase 成为所有业务线的唯一“公安局”。

## 现状优势
由于 Eduflow 当前没有存量用户（已被清空），这为我们省去了最棘手的“同邮箱冲突处理”和“历史数据洗刷迁移”的沉重负担。我们可以直接轻装上阵，进行“原生级别”的大重构！

## 实施阶段与步骤

### 阶段 1：Eduflow 数据模型 (Database) 的底层改造
因为我们不再需要本地维护密码，也不再由 Eduflow 签发通行证：
1. **废弃 `Account` 表**：将其彻底从 SQLite 数据库和 `models.py` 定义中抹除。
2. **重铸 `User` 表的安全外键**：将原先绑定 `account_id`（自增纯数字）的地方，强力升级替换为绑定 Supabase 下发的 `UUID` 字符串格式身份码（如：`auth_id = Column(String, unique=True, index=True)`）。这意味着，此后的每一条 Eduflow 学习记录，都直接物理绑定了 `sxu.com` 的用户身份。

### 阶段 2：后端架构 (FastAPI) 史诗级换血
原来的本地 JWT 签发和基于密码哈希的校验逻辑将全部作废。
1. 移除 `FastAPI` 里所有处理密码验证和生成原生 Token 的过时代码。
2. 将所有受保护的数据流路由（`/api/goals`, `/api/calendar` 等），修改为**直接验证并解析前端传来的 Supabase Access Token (JWT)**。
3. 一旦 Token 验证通过被识破合法，FastAPI 就会从中提取到当前操作者的 `Supabase UUID`，再拿着这个 ID 去 SQLite 库里拿回他的私域数据。

### 阶段 3：前端 (React/Next.js) 的彻底剥离
1. 将 Eduflow 现存的那套独立的登录、注册页面 UI 完全斩断移除。
2. 在前端安装 `@supabase/supabase-js` 客户端，接管状态树。
3. 建立拦截器：当游客试图访问受到保护的 Eduflow 面板时，如果不带有合法的 Supabase Session 数据，直接将他们**无情重定向到** `sxu.com/login` 统一登录门户。

### 阶段 4：单点登录 (SSO) 跨域通信闭环
要实现真正的“在 SXU 登录了，打开 Eduflow 就自动是已登录状态魔术”，我们需要：
- **同根域名策略**：把 Eduflow 部署到 `eduflow.sxu.com` 这样的标准子域名上。
- **Cookie 穿透共享**：将 Supabase 颁发的身份信息锁死在顶级的 `.sxu.com` 根级 Cookie 里。这样，当浏览器首次满载而归打开 `eduflow.sxu.com` 时，就会自带这把“总门钥匙”，让前端一秒通关进入内置仪表盘！

## 总结
这是一场壮士断腕但能让 Eduflow 真正长出“大厂生态翅膀”的重要升级，随时可以启动这套降维打击式的整合改造。

# Roome Auth Server

用户认证服务器，提供注册、登录、用户管理功能。

## 快速开始

```bash
# 进入目录
cd server

# 删除旧的 node_modules (如果存在)
rm -rf node_modules

# 安装依赖
npm install

# 启动服务器
npm start

# 开发模式 (自动重启)
npm run dev
```

服务器启动后：
- API 地址: http://localhost:3100
- 管理后台: http://localhost:3100/admin

## 配置

环境变量 (可在 `.env` 文件中设置):

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3100 | 服务器端口 |
| JWT_SECRET | cherry-studio-secret-key... | JWT 密钥 (生产环境必须修改) |
| JWT_EXPIRES_IN | 7d | Token 过期时间 |
| ADMIN_PASSWORD | admin123 | 管理后台密码 |
| DB_PATH | ./data/users.db | 数据库文件路径 |

## API 接口

### 用户认证

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456",
  "name": "用户名"  // 可选
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

#### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer <token>
```

#### 更新用户信息
```
PUT /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "avatar": "头像URL"
}
```

### 管理接口

所有管理接口需要在 Header 中传递 `X-Admin-Password`。

#### 获取用户列表
```
GET /api/admin/users
X-Admin-Password: admin123
```

#### 更新用户
```
PUT /api/admin/users/:id
X-Admin-Password: admin123
Content-Type: application/json

{
  "email": "new@example.com",
  "name": "新名称",
  "password": "新密码"  // 可选
}
```

#### 删除用户
```
DELETE /api/admin/users/:id
X-Admin-Password: admin123
```

## 部署

### 使用 PM2

```bash
npm install -g pm2
pm2 start src/index.js --name cherry-auth
```

### 使用 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3100
CMD ["node", "src/index.js"]
```

## 安全建议

1. 生产环境务必修改 `JWT_SECRET` 和 `ADMIN_PASSWORD`
2. 使用 HTTPS
3. 配置防火墙，只开放必要端口
4. 定期备份数据库文件

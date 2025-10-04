# 视频提取后端系统

基于Node.js开发的视频提取后端系统，支持多平台视频链接解析，包括抖音/TikTok、哔哩哔哩、小红书等主流平台。

## 功能特性

- 🎯 **多平台支持**: 抖音/TikTok、哔哩哔哩、小红书、快手等
- 🔑 **API密钥管理**: 完整的CRUD操作和状态管理
- 🚀 **高性能**: 支持并发请求，响应时间优化
- 🛡️ **安全防护**: 请求频率限制、输入验证、错误处理
- 📝 **完整日志**: 详细的请求和错误日志记录
- 🔄 **自动重试**: 智能的密钥轮询和失败重试机制

## 技术栈

- **运行环境**: Node.js 16+
- **Web框架**: Express.js
- **数据库**: MySQL 5.7
- **数据库连接**: mysql2
- **HTTP客户端**: axios
- **数据验证**: joi
- **日志记录**: winston
- **安全**: helmet, cors
- **请求限制**: express-rate-limit

## 快速开始

### 1. 环境要求

- Node.js 16.0.0 或更高版本
- MySQL 5.7 或更高版本
- npm 或 yarn 包管理器

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境配置文件并修改：

```bash
cp config/env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=12345678@
DB_NAME=video_extract_db

# 第三方API配置
THIRD_PARTY_API_URL=https://www.52api.cn/api/video_parse
```

### 4. 数据库设置

创建数据库：

```sql
CREATE DATABASE video_extract_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

系统会在启动时自动创建必需的数据表。

### 5. 启动服务

开发环境：
```bash
npm run dev
```

生产环境：
```bash
npm start
```

服务启动后访问：
- API文档: http://localhost:3000/api
- 健康检查: http://localhost:3000/api/video/health

## API接口

### 视频解析接口

#### POST /api/video/parse

解析视频链接，获取视频信息和下载地址。

**请求体：**
```json
{
  "url": "短视频作品分享链接",
  "platform": "auto",
  "options": {
    "preferredQuality": "high",
    "extractAudio": false
  }
}
```

**响应：**
```json
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "platform": "平台名称",
    "title": "视频标题",
    "author": "作者信息",
    "duration": "视频时长",
    "videoUrl": "视频下载链接",
    "coverImage": "封面图片",
    "description": "视频描述"
  },
  "exec_time": 1.23,
  "user_ip": "客户端IP"
}
```

#### GET /api/video/platforms

获取支持的平台列表。

#### GET /api/video/health

健康检查接口。

### 密钥管理接口

#### GET /api/admin/keys

获取所有API密钥列表。

#### POST /api/admin/keys

添加新的API密钥。

**请求体：**
```json
{
  "keyName": "密钥名称",
  "keyValue": "密钥值",
  "description": "密钥描述"
}
```

#### PUT /api/admin/keys/:keyId

更新指定的API密钥。

#### DELETE /api/admin/keys/:keyId

删除指定的API密钥。

#### POST /api/admin/keys/batch/status

批量更新密钥状态。

## 支持的平台

| 平台 | 域名 | 状态 |
|------|------|------|
| 抖音/TikTok | douyin.com, tiktok.com | ✅ |
| 哔哩哔哩 | bilibili.com, b23.tv | ✅ |
| 小红书 | xiaohongshu.com, xhslink.com | ✅ |
| 快手 | kuaishou.com | ✅ |

## 错误处理

系统采用统一的错误响应格式：

```json
{
  "code": 400,
  "msg": "错误描述",
  "data": null,
  "debug": "详细错误信息（仅开发环境）",
  "exec_time": 0.05,
  "user_ip": "客户端IP"
}
```

常见错误码：
- `400`: 请求参数错误
- `404`: 资源不存在
- `429`: 请求过于频繁
- `500`: 服务器内部错误
- `502`: 第三方API调用失败
- `503`: 服务暂时不可用

## 请求限制

为保护系统稳定性，设置了以下请求限制：

- **通用接口**: 15分钟内最多100次请求
- **视频解析**: 5分钟内最多20次请求
- **管理接口**: 10分钟内最多50次请求

## 部署指南

### 使用PM2部署

1. 安装PM2：
```bash
npm install -g pm2
```

2. 创建PM2配置文件 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'video-extract-backend',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

3. 启动服务：
```bash
pm2 start ecosystem.config.js
```

### 使用Docker部署

1. 构建镜像：
```bash
docker build -t video-extract-backend .
```

2. 运行容器：
```bash
docker run -d \
  --name video-extract-backend \
  -p 3000:3000 \
  -e DB_HOST=your_mysql_host \
  -e DB_PASSWORD=your_password \
  video-extract-backend
```

## 开发指南

### 项目结构

```
├── app.js                 # 主应用文件
├── package.json          # 项目配置
├── config/              # 配置文件
│   ├── database.js      # 数据库配置
│   ├── logger.js        # 日志配置
│   └── env.example      # 环境变量示例
├── controllers/         # 控制器
│   ├── videoController.js
│   └── keyController.js
├── services/           # 服务层
│   ├── videoService.js
│   └── keyService.js
├── utils/              # 工具函数
│   └── urlProcessor.js
├── validators/         # 数据验证
│   ├── videoValidator.js
│   └── keyValidator.js
├── middleware/         # 中间件
│   ├── errorHandler.js
│   └── rateLimiter.js
├── routes/            # 路由
│   ├── videoRoutes.js
│   └── keyRoutes.js
└── logs/              # 日志文件
```

### 添加新平台支持

1. 在 `utils/urlProcessor.js` 中添加平台检测逻辑
2. 在 `validators/videoValidator.js` 中添加验证规则
3. 测试URL处理和验证功能

### 自定义验证规则

参考 `validators/` 目录下的现有验证器，使用 Joi 库创建新的验证规则。

## 监控和日志

### 日志位置

- 应用日志: `logs/combined.log`
- 错误日志: `logs/error.log`

### 日志格式

```json
{
  "timestamp": "2025-01-15 10:30:00",
  "level": "info",
  "message": "HTTP Request",
  "service": "video-extract-backend",
  "method": "POST",
  "url": "/api/video/parse",
  "status": 200,
  "duration": "1.23s",
  "ip": "127.0.0.1"
}
```

## 常见问题

### Q: 数据库连接失败怎么办？

A: 检查以下配置：
1. 确认MySQL服务正在运行
2. 检查数据库连接信息是否正确
3. 确认数据库用户有足够权限
4. 检查防火墙设置

### Q: 第三方API调用失败？

A: 可能的原因：
1. API密钥无效或过期
2. 网络连接问题
3. 第三方服务临时不可用
4. 请求格式不正确

### Q: 如何添加新的API密钥？

A: 使用管理接口添加：
```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "keyName": "新密钥",
    "keyValue": "your_api_key",
    "description": "密钥描述"
  }'
```

## 许可证

MIT License

## 贡献指南

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。 
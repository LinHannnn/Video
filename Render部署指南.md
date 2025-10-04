# Render 云端部署完整指南

## 📖 目录

1. [什么是 Render](#什么是-render)
2. [准备工作](#准备工作)
3. [详细部署步骤](#详细部署步骤)
4. [配置环境变量](#配置环境变量)
5. [部署监控](#部署监控)
6. [更新小程序配置](#更新小程序配置)
7. [常见问题](#常见问题)

---

## 什么是 Render

**Render** 是一个现代化的云平台，可以轻松部署和托管 Web 应用、API、数据库等。

### 优势：

✅ **免费套餐** - 提供免费的 Web Service  
✅ **自动部署** - Git 推送后自动部署  
✅ **HTTPS 支持** - 自动配置 SSL 证书  
✅ **简单易用** - 无需配置服务器  
✅ **全球 CDN** - 快速访问  

### 免费套餐限制：

⚠️ 15分钟无请求后会休眠（首次访问需要几秒唤醒）  
⚠️ 每月 750 小时免费（对个人项目足够）  
⚠️ 共享资源（性能有限）

---

## 准备工作

### ✅ 已完成

- [x] GitHub 账号：https://github.com/LinHannnn
- [x] GitHub 仓库：https://github.com/LinHannnn/Video.git
- [x] 后端代码已推送

### 📝 需要准备的信息

记录以下信息，稍后配置时需要：

```
微信小程序 AppID: wx638ec29150825d0d
微信小程序 AppSecret: 617f24596dad3bf25b9a5552611a7536
JWT Secret: P3vl0uqEMB5FNQrkmyWYwVxCR2s9Ua7n
数据库配置: (如果有的话)
```

---

## 详细部署步骤

### 第一步：注册 Render 账号

1. **访问 Render 官网**
   - 打开浏览器，访问：https://render.com
   
2. **注册账号**
   - 点击右上角 "Get Started" 或 "Sign Up"
   - 选择 "Sign up with GitHub"（推荐）
   - 授权 Render 访问你的 GitHub 账号
   
3. **完成注册**
   - 验证邮箱地址
   - 进入 Render 控制台

---

### 第二步：创建新的 Web Service

#### 2.1 点击 "New +" 按钮

在 Render 控制台顶部，点击 "**New +**" 按钮，选择 "**Web Service**"

#### 2.2 连接 GitHub 仓库

1. 如果是第一次使用，点击 "**Connect account**" 连接 GitHub
2. 授权 Render 访问你的仓库
3. 在仓库列表中找到 `LinHannnn/Video`
4. 点击 "**Connect**"

> 💡 **提示**：如果没有看到你的仓库，点击 "Configure GitHub App" 添加访问权限

#### 2.3 配置服务基本信息

填写以下配置：

**Name（服务名称）**
```
video-extract-backend
```
> 💡 这个名称会成为你的URL的一部分：`https://video-extract-backend.onrender.com`

**Region（地区）**
```
Singapore (Southeast Asia)
```
> 💡 选择离中国近的服务器，新加坡是最佳选择

**Branch（分支）**
```
main
```
> 💡 选择你的主分支（main 或 master）

**Root Directory（根目录）**
```
（留空）
```
> 💡 因为后端代码在根目录，所以留空

**Runtime（运行环境）**
```
Node
```

**Build Command（构建命令）**
```
npm install
```

**Start Command（启动命令）**
```
npm start
```

**Instance Type（实例类型）**
```
Free
```
> 💡 选择免费套餐

---

### 第三步：配置环境变量

这是**最重要**的一步！所有敏感信息都要在这里配置。

#### 3.1 点击 "Advanced" 按钮

在创建服务页面底部，点击 "**Advanced**" 展开高级选项

#### 3.2 添加环境变量

点击 "**Add Environment Variable**" 按钮，逐个添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `PORT` | `3000` | 服务端口 |
| `NODE_ENV` | `production` | 生产环境 |
| `WX_APPID` | `wx638ec29150825d0d` | ⚠️ 替换为你的 |
| `WX_APP_SECRET` | `617f24596dad3bf25b9a5552611a7536` | ⚠️ 替换为你的 |
| `JWT_SECRET` | `P3vl0uqEMB5FNQrkmyWYwVxCR2s9Ua7n` | ⚠️ 保密 |
| `THIRD_PARTY_API_URL` | `https://www.52api.cn/api/video_parse` | 视频解析API |
| `LOG_LEVEL` | `info` | 日志级别 |
| `RATE_LIMIT_WINDOW` | `15` | 速率限制窗口 |
| `RATE_LIMIT_MAX` | `100` | 最大请求数 |
| `CACHE_TTL` | `900` | 缓存时间 |

> ⚠️ **重要**：如果你使用数据库，也要添加数据库相关的环境变量

#### 3.3 数据库配置（可选）

如果你的应用使用 MySQL 数据库，有两个选择：

**选项 A：跳过数据库（推荐用于测试）**

添加这个环境变量：
```
Key: SKIP_DATABASE
Value: true
```

**选项 B：使用外部数据库**

可以使用以下免费数据库服务：
- [PlanetScale](https://planetscale.com) - 免费 MySQL
- [Railway](https://railway.app) - $5/月，包含数据库
- [阿里云RDS](https://www.aliyun.com/product/rds) - 按需付费

添加数据库连接信息：
```
DB_HOST: your-database-host
DB_PORT: 3306
DB_USER: your-username
DB_PASSWORD: your-password
DB_NAME: your-database-name
```

---

### 第四步：部署服务

#### 4.1 创建服务

确认所有配置无误后，点击页面底部的 "**Create Web Service**" 按钮

#### 4.2 等待部署完成

Render 会自动执行以下步骤：

```
1. 📥 克隆 GitHub 仓库
   ↓
2. 📦 运行 npm install 安装依赖
   ↓
3. 🚀 运行 npm start 启动服务
   ↓
4. ✅ 部署成功
```

**部署时间**：通常需要 2-5 分钟

**查看进度**：
- 在 Render 控制台可以看到实时日志
- 日志会显示详细的构建和部署过程

#### 4.3 确认部署成功

当看到以下信息时，说明部署成功：

```
✅ Your service is live 🎉
```

部署成功后，你会获得一个公网地址，格式如下：

```
https://video-extract-backend.onrender.com
```

---

## 第五步：测试部署的服务

### 5.1 测试健康检查

在浏览器中访问（替换为你的实际URL）：

```
https://video-extract-backend.onrender.com/api/video/health
```

如果看到类似以下的 JSON 响应，说明服务正常：

```json
{
  "code": 200,
  "msg": "服务正常",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "database": "connected",
    "features": {
      "video_parsing": true,
      "key_management": true
    }
  }
}
```

### 5.2 测试 API 文档

访问：
```
https://video-extract-backend.onrender.com/api
```

应该能看到完整的 API 文档信息

---

## 第六步：更新小程序配置

### 6.1 获取你的部署 URL

在 Render 控制台，你的服务顶部会显示 URL，类似：

```
https://video-extract-backend.onrender.com
```

复制这个 URL

### 6.2 更新小程序 API 配置

**编辑文件：** `miniprogram/utils/api.js`

找到 `getConfig()` 函数，修改为：

```javascript
const getConfig = () => {
  try {
    const accountInfo = wx.getAccountInfoSync()
    const systemInfo = wx.getSystemInfoSync()
    const isSimulator = systemInfo.platform === 'devtools'
    
    if (isSimulator) {
      // 开发工具环境 - 使用本地
      return {
        baseUrl: 'http://127.0.0.1:3000/api',
        debug: true,
        timeout: 10000
      }
    } else {
      // 真机环境 - 使用云端部署
      return {
        baseUrl: 'https://video-extract-backend.onrender.com/api', // ⚠️ 替换为你的URL
        debug: false,
        timeout: 15000
      }
    }
  } catch (error) {
    console.error('获取环境配置失败:', error)
    return {
      baseUrl: 'https://video-extract-backend.onrender.com/api', // ⚠️ 替换为你的URL
      debug: false,
      timeout: 15000
    }
  }
}
```

### 6.3 配置微信小程序服务器域名

⚠️ **重要**：在真机上使用云端服务，必须配置服务器域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 "开发" → "开发管理" → "开发设置" → "服务器域名"
3. 在 "**request合法域名**" 中添加：
   ```
   https://video-extract-backend.onrender.com
   ```
4. 保存配置

> 💡 **注意**：域名配置后可能需要几分钟生效

### 6.4 重新编译小程序

1. 在微信开发者工具中点击 "编译" 按钮
2. 生成预览二维码
3. 用手机扫码测试

---

## 部署监控

### 查看服务状态

在 Render 控制台，你可以：

- **查看日志**：实时查看应用运行日志
- **监控性能**：查看 CPU、内存使用情况
- **重启服务**：手动重启应用
- **查看部署历史**：所有部署记录

### 自动部署

配置完成后，每次你推送代码到 GitHub，Render 会自动：

1. 检测到代码更新
2. 自动拉取最新代码
3. 重新构建和部署
4. 部署完成后自动上线

---

## 常见问题

### Q1: 首次访问很慢？

**原因**：免费套餐在无请求时会休眠

**解决方案**：
- 第一次访问需要等待 10-30 秒唤醒
- 可以使用定时任务保持活跃（如 UptimeRobot）
- 或升级到付费套餐（$7/月）

### Q2: 如何查看错误日志？

1. 进入 Render 控制台
2. 选择你的服务
3. 点击左侧 "Logs" 查看实时日志
4. 可以搜索和过滤日志

### Q3: 如何更新环境变量？

1. 进入服务详情页
2. 点击左侧 "Environment"
3. 修改或添加变量
4. 点击 "Save Changes"
5. Render 会自动重新部署

### Q4: 数据库连接失败？

检查：
- 环境变量是否配置正确
- 数据库是否允许外部访问
- 如果不需要数据库，设置 `SKIP_DATABASE=true`

### Q5: 部署失败？

常见原因：
- **依赖安装失败**：检查 `package.json` 是否正确
- **启动命令错误**：确认 `npm start` 可以正常运行
- **端口配置错误**：确保使用 `process.env.PORT`
- **环境变量缺失**：检查必需的环境变量

查看详细错误：
1. 点击服务页面的 "Logs"
2. 查看构建和部署日志
3. 定位具体错误信息

### Q6: 如何回滚到之前的版本？

1. 进入服务详情页
2. 点击左侧 "Deploys"
3. 找到之前的成功部署
4. 点击 "Redeploy"

### Q7: 免费套餐够用吗？

对于个人项目和测试：
- ✅ 完全够用
- ✅ 每月 750 小时免费时间
- ⚠️ 15分钟不活跃会休眠
- ⚠️ 性能有限（共享资源）

如果是生产环境，建议升级到 $7/月 套餐：
- 不会休眠
- 更好的性能
- 更多资源

---

## 🎉 完成部署

恭喜！现在你的后端服务已经部署到云端了！

**你的服务地址：**
```
https://video-extract-backend.onrender.com
```

**测试地址：**
- 健康检查：`https://video-extract-backend.onrender.com/api/video/health`
- API文档：`https://video-extract-backend.onrender.com/api`
- Swagger文档：`https://video-extract-backend.onrender.com/api/docs`

---

## 📝 下一步

1. ✅ 测试所有 API 功能
2. ✅ 在真机上测试小程序
3. ✅ 监控服务运行状态
4. ✅ 配置微信小程序服务器域名
5. ✅ 考虑使用定时任务防止休眠

---

## 🔗 有用的链接

- **Render 官网**：https://render.com
- **Render 文档**：https://render.com/docs
- **你的 GitHub 仓库**：https://github.com/LinHannnn/Video
- **Render 控制台**：https://dashboard.render.com
- **微信公众平台**：https://mp.weixin.qq.com

---

## 💡 Pro Tips

1. **设置自定义域名**（可选）
   - 在 Render 控制台可以绑定自己的域名
   - 需要有自己的域名并配置 DNS

2. **启用持续集成**
   - 已自动启用！每次 Git 推送都会自动部署

3. **监控服务健康**
   - 使用 [UptimeRobot](https://uptimerobot.com) 监控服务
   - 每5分钟 ping 一次防止休眠

4. **查看实时日志**
   - 在 Render 控制台可以实时查看应用日志
   - 便于调试和监控

5. **环境分离**
   - 可以创建多个服务（dev、staging、production）
   - 每个使用不同的分支

---

需要帮助？随时问我！🚀


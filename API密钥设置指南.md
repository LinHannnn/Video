# 52api.cn API密钥设置指南

## 📋 概述

本系统使用 52api.cn 提供的视频解析服务，需要您先获取API密钥才能正常使用视频解析功能。

## 🔗 获取API密钥

### 1. 注册账号
1. 访问 [52api.cn](https://www.52api.cn)
2. 点击右上角"注册"按钮
3. 填写注册信息并完成邮箱验证

### 2. 获取密钥
1. 登录账号后，进入"控制台"
2. 找到"密钥管理"页面
3. 复制您的API密钥（类似：`abcd1234efgh5678`）

## ⚙️ 配置密钥

### 方法一：使用更新脚本（推荐）
```bash
# 将 your_real_api_key 替换为您的真实密钥
node scripts/update-api-key.js 0f8fs3JBphLnyMzoMrIonixkqu
```

### 方法二：使用API接口
```bash
# 使用PUT接口更新密钥
curl -X PUT http://localhost:3000/api/keys/1 \
  -H "Content-Type: application/json" \
  -d '{"keyValue": "your_real_api_key"}'
```

### 方法三：直接修改数据库
```sql
UPDATE api_keys 
SET key_value = 'your_real_api_key' 
WHERE id = 1;
```

## 🧪 测试配置

配置完成后，运行测试脚本验证：
```bash
node test-video-parse.js
```

成功的响应应该包含视频信息而不是错误消息。

## 📊 API使用规范

### 请求限制
- **免费版**：每分钟有请求频率限制
- **专业版**：支持高频率请求
- 建议控制请求频率，避免被临时屏蔽

### 支持的平台
- ✅ 抖音/TikTok
- ✅ 哔哩哔哩
- ✅ 小红书
- ✅ 快手
- ✅ 其他主流视频平台

### URL格式支持
系统会自动从复杂文本中提取视频链接：
```javascript
// ✅ 支持的格式
"https://v.douyin.com/iFRvuEjE/"
"【视频标题】https://www.bilibili.com/video/BV1xx4y1Z7zz 分享内容"
"😊 看了这个视频 https://www.xiaohongshu.com/discovery/item/xxx 👍"
```

## 🔧 故障排除

### 常见错误

1. **"请求密钥KEY不正确！"**
   - 检查密钥是否正确配置
   - 确认密钥在52api.cn控制台是有效的

2. **"请求频率超过限制"**
   - 降低请求频率
   - 考虑升级到专业版
   - 等待限制重置（通常10分钟）

3. **"网络连接失败"**
   - 检查网络连接
   - 确认52api.cn服务状态

### 调试技巧

1. **查看详细日志**
```bash
# 启动时查看控制台日志
pnpm dev
```

2. **检查密钥状态**
```bash
# 查看当前配置的密钥
node scripts/add-api-key.js
```

3. **单独测试API**
```bash
# 直接测试52api.cn接口
curl "https://www.52api.cn/api/video_parse?key=your_key&url=https://v.douyin.com/test"
```

## 📝 相关文档

- [API接口文档](http://localhost:3000/api/docs) - Swagger UI文档
- [52api.cn官方文档](https://www.52api.cn/docs)
- [项目README](./README.md) - 完整项目文档

## 💡 提示

- 建议保存密钥的备份
- 定期检查密钥的有效性
- 生产环境建议使用专业版服务
- 密钥请妥善保管，不要泄露给他人 
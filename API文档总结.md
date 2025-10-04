# 视频提取后端API文档

## 📋 快速访问

- **Swagger UI文档**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/openapi.json
- **健康检查**: http://localhost:3000/api/video/health

## 🎯 核心接口

### 1. 视频解析接口

#### POST `/api/video/parse`
解析视频链接，获取视频信息和下载地址

**✨ 简化请求 - 只需要一个 `url` 字段:**
```json
{
  "url": "https://v.douyin.com/iFRvuEjE/"
}
```

**🎯 核心特性:**
- ✅ **简单易用** - 只需传递一个 `url` 字段
- ✅ **智能识别** - 自动检测平台类型（抖音/B站/小红书/快手等）
- ✅ **文本处理** - 自动从复杂分享文本中提取URL
- ✅ **格式兼容** - 支持包含emoji、中文、标题的分享链接

**🌐 支持的URL格式示例:**
```json
// 抖音
{"url": "https://v.douyin.com/iFRvuEjE/"}

// 哔哩哔哩（包含分享文本）
{"url": "【标题】https://www.bilibili.com/video/BV1xx4y1Z7zz 🌟分享内容"}

// 小红书（包含emoji和文本）
{"url": "😊 看了这个视频 https://www.xiaohongshu.com/discovery/item/xxx 👍"}

// 快手
{"url": "https://kuaishou.com/s/xxx"}
```

**⚙️ 完整请求格式（兼容旧版本）:**
```json
{
  "url": "https://v.douyin.com/iFRvuEjE/",
  "platform": "auto",
  "options": {
    "preferredQuality": "high",
    "extractAudio": false
  }
}
```

**📝 字段说明:**
- `url` (必填): 视频分享链接，支持各种格式，系统自动识别平台
- `platform` (可选): 手动指定平台，默认 `auto` 自动识别
- `options` (可选): 解析选项
  - `preferredQuality`: 视频质量 `high|medium|low`，默认 `high`
  - `extractAudio`: 是否提取音频，默认 `false`

**响应示例:**
```json
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "platform": "抖音",
    "title": "精彩视频标题",
    "author": "创作者昵称",
    "duration": "00:30",
    "videoUrl": "https://aweme.snssdk.com/aweme/v1/xxx",
    "coverImage": "https://p3-sign.douyinpic.com/xxx",
    "description": "视频描述内容"
  },
  "exec_time": 1.234,
  "user_ip": "127.0.0.1"
}
```

#### GET `/api/video/platforms`
获取支持的平台列表

**响应示例:**
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "platforms": [
      {"key": "douyin", "name": "抖音/TikTok"},
      {"key": "bilibili", "name": "哔哩哔哩"},
      {"key": "xiaohongshu", "name": "小红书"},
      {"key": "kuaishou", "name": "快手"}
    ],
    "total": 4
  }
}
```

### 2. 密钥管理接口

#### GET `/api/admin/keys`
获取所有API密钥

#### POST `/api/admin/keys`
添加新密钥

**请求示例:**
```json
{
  "keyName": "主密钥1",
  "keyValue": "52api_your_actual_key_here",
  "description": "主要使用的52API密钥"
}
```

#### PUT `/api/admin/keys/{keyId}`
更新密钥信息

#### DELETE `/api/admin/keys/{keyId}`
删除指定密钥

#### POST `/api/admin/keys/batch/status`
批量更新密钥状态

### 3. 系统监控接口

#### GET `/api/video/health`
健康检查

**响应示例:**
```json
{
  "code": 200,
  "msg": "服务正常",
  "data": {
    "status": "healthy",
    "database": "connected",
    "features": {
      "video_parsing": true,
      "key_management": true
    }
  }
}
```

## 🔧 支持的平台

| 平台 | 域名 | 平台标识 | URL处理 |
|------|------|----------|---------|
| 抖音/TikTok | douyin.com, tiktok.com | douyin | 直接使用 |
| 哔哩哔哩 | bilibili.com, b23.tv | bilibili | 自动提取https链接 |
| 小红书 | xiaohongshu.com, xhslink.com | xiaohongshu | 自动提取https链接 |
| 快手 | kuaishou.com | kuaishou | 自动提取https链接 |

## 📝 请求格式

所有POST/PUT请求需要设置请求头：
```
Content-Type: application/json
```

## 🚫 错误响应格式

```json
{
  "code": 400,
  "msg": "错误描述",
  "data": null,
  "errors": [
    {
      "field": "url",
      "message": "URL不能为空"
    }
  ],
  "debug": "详细错误信息（仅开发环境）",
  "exec_time": 0.05,
  "user_ip": "127.0.0.1"
}
```

## 🔒 请求限制

- **通用接口**: 15分钟内最多100次请求
- **视频解析**: 5分钟内最多20次请求
- **管理接口**: 10分钟内最多50次请求

## 📱 使用示例

### 使用curl测试

```bash
# 1. 健康检查
curl http://localhost:3000/api/video/health

# 2. 获取支持平台
curl http://localhost:3000/api/video/platforms

# 3. 解析抖音视频（简化格式）
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://v.douyin.com/iFRvuEjE/"}'

# 4. 解析哔哩哔哩视频（包含分享文本）
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "【标题】https://www.bilibili.com/video/BV1xx4y1Z7zz 🌟分享内容"}'

# 5. 添加API密钥
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "keyName": "测试密钥",
    "keyValue": "your_52api_key_here",
    "description": "测试用密钥"
  }'
```

### 使用JavaScript

```javascript
// 简化版本 - 只需要URL
const response = await fetch('http://localhost:3000/api/video/parse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://v.douyin.com/iFRvuEjE/'
  })
});

const result = await response.json();
console.log(result);

// 支持各种格式的URL
const urls = [
  'https://v.douyin.com/iFRvuEjE/',
  '【标题】https://www.bilibili.com/video/BV1xx4y1Z7zz 🌟分享内容',
  '😊 看了这个视频 https://www.xiaohongshu.com/discovery/item/xxx 👍'
];

for (const url of urls) {
  const response = await fetch('http://localhost:3000/api/video/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const result = await response.json();
  console.log(`平台: ${result.data?.platform}, 标题: ${result.data?.title}`);
}
```

### 使用Python

```python
import requests

# 简化请求 - 只需要URL
def parse_video(url):
    response = requests.post('http://localhost:3000/api/video/parse', 
        json={'url': url}
    )
    return response.json()

# 测试不同平台
urls = [
    'https://v.douyin.com/iFRvuEjE/',
    '【标题】https://www.bilibili.com/video/BV1xx4y1Z7zz 🌟分享内容',
    '😊 看了这个视频 https://www.xiaohongshu.com/discovery/item/xxx 👍'
]

for url in urls:
    result = parse_video(url)
    if result['code'] == 200:
        data = result['data']
        print(f"平台: {data['platform']}, 标题: {data['title']}")
    else:
        print(f"解析失败: {result['msg']}")
```

## 🎉 接口特点

✅ **极简设计**: 只需要一个URL参数就能解析  
✅ **智能识别**: 自动识别平台类型和处理复杂的分享链接  
✅ **格式容错**: 支持包含文本、emoji的分享内容  
✅ **向下兼容**: 完全兼容旧版本的完整请求格式  
✅ **统一响应**: 所有平台返回统一的数据格式  

现在您只需要传入一个URL就能自动解析任何支持平台的视频了！🚀

访问 http://localhost:3000/api/docs 查看完整的交互式API文档！ 
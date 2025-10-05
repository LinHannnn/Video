# 📚 API文档使用指南

## 📄 文档位置

API文档已生成：`docs/announcements-api.yaml`

---

## 🎯 在线预览工具

### 方法1：Swagger Editor（推荐）

1. 访问 https://editor.swagger.io/
2. 点击 `File` -> `Import File`
3. 上传 `announcements-api.yaml` 文件
4. 即可查看交互式API文档

### 方法2：Swagger UI

```bash
# 安装 swagger-ui-watcher
npm install -g swagger-ui-watcher

# 启动预览服务
swagger-ui-watcher docs/announcements-api.yaml
```

访问：http://localhost:8000

### 方法3：VS Code插件

1. 安装插件：`OpenAPI (Swagger) Editor`
2. 右键点击 `announcements-api.yaml`
3. 选择 `Preview OpenAPI`

---

## 📖 文档内容概览

### 包含的接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取有效公告 | GET | /announcements/active | 前端使用 |
| 获取所有公告 | GET | /announcements | 管理端 |
| 创建公告 | POST | /announcements | 管理端 |
| 更新公告 | PUT | /announcements/:id | 管理端 |
| 删除公告 | DELETE | /announcements/:id | 管理端 |
| 批量更新状态 | POST | /announcements/batch/status | 管理端 |

### 包含的数据模型

- **AnnouncementPublic** - 公开信息（前端）
- **AnnouncementFull** - 完整信息（管理端）
- **AnnouncementCreate** - 创建数据
- **AnnouncementUpdate** - 更新数据

---

## 🚀 快速测试

### 在Swagger Editor中测试

1. 在 Swagger Editor 中打开文档
2. 点击 `Servers` 选择环境
   - Production: `https://lhbxbuktfrop.sealoshzh.site/api`
   - Local: `http://localhost:3000/api`
3. 展开任意接口
4. 点击 `Try it out`
5. 填写参数后点击 `Execute`

### 使用curl测试

```bash
# 获取有效公告
curl https://lhbxbuktfrop.sealoshzh.site/api/announcements/active

# 创建公告
curl -X POST https://lhbxbuktfrop.sealoshzh.site/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "content": "测试公告",
    "status": 1,
    "priority": 10
  }'
```

---

## 🛠️ 生成客户端代码

### 使用 openapi-generator

```bash
# 安装工具
npm install -g @openapitools/openapi-generator-cli

# 生成 JavaScript 客户端
openapi-generator-cli generate \
  -i docs/announcements-api.yaml \
  -g javascript \
  -o client/javascript

# 生成 Python 客户端
openapi-generator-cli generate \
  -i docs/announcements-api.yaml \
  -g python \
  -o client/python

# 生成 Java 客户端
openapi-generator-cli generate \
  -i docs/announcements-api.yaml \
  -g java \
  -o client/java
```

支持的语言：
- JavaScript/TypeScript
- Python
- Java
- Go
- PHP
- Ruby
- C#
- Swift
- Kotlin
- 等50+语言

---

## 📝 集成到项目

### 方法1：在Express中集成Swagger UI

```bash
# 安装依赖
npm install swagger-ui-express yamljs
```

在 `app.js` 中添加：

```javascript
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// 加载 OpenAPI 文档
const swaggerDocument = YAML.load('./docs/announcements-api.yaml');

// 添加 Swagger UI 路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

访问：http://localhost:3000/api-docs

### 方法2：使用 Redoc

```bash
npm install redoc-express
```

```javascript
const redoc = require('redoc-express');

app.use('/docs', redoc({
  spec: './docs/announcements-api.yaml',
  title: 'API文档'
}));
```

---

## 🔄 文档同步

### 自动生成文档

创建脚本 `scripts/generate-docs.js`：

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

// 从代码注释生成文档
// 或从路由自动提取接口信息
// ...

fs.writeFileSync(
  './docs/announcements-api.yaml',
  yaml.dump(apiDoc)
);
```

### 使用工具自动生成

```bash
# 使用 swagger-jsdoc 从注释生成
npm install swagger-jsdoc

# 在代码中添加注释
/**
 * @swagger
 * /announcements/active:
 *   get:
 *     summary: 获取有效公告
 *     ...
 */
```

---

## 📊 文档特性

### ✅ 已包含的特性

- [x] 完整的接口定义
- [x] 详细的请求参数说明
- [x] 多个请求示例
- [x] 完整的响应示例
- [x] 错误码说明
- [x] 数据模型定义
- [x] 参数验证规则
- [x] 接口分组（tags）
- [x] 环境配置（servers）
- [x] 安全认证说明

### 📋 文档结构

```yaml
openapi: 3.0.3
info:              # API基本信息
  title: ...
  description: ...
  version: ...
  
servers:           # 服务器配置
  - url: ...
  
tags:              # 接口分组
  - name: ...
  
paths:             # 接口定义
  /path:
    method:
      tags: ...
      summary: ...
      parameters: ...
      requestBody: ...
      responses: ...
      
components:        # 可复用组件
  schemas:         # 数据模型
  responses:       # 响应模板
  securitySchemes: # 认证方式
```

---

## 💡 最佳实践

### 1. 保持文档更新

```bash
# 接口修改后及时更新文档
# 建议在PR中同时更新API文档
```

### 2. 添加详细示例

```yaml
examples:
  success:
    summary: 成功示例
    value:
      code: 200
      data: ...
```

### 3. 使用引用减少重复

```yaml
# 使用 $ref 引用
schema:
  $ref: '#/components/schemas/Announcement'
```

### 4. 添加请求/响应示例

```yaml
examples:
  basicCreate:
    summary: 基础创建
    value: {...}
  timedCreate:
    summary: 限时公告
    value: {...}
```

---

## 🔍 文档验证

### 在线验证

访问：https://apitools.dev/swagger-parser/online/

上传 `announcements-api.yaml` 进行验证

### 命令行验证

```bash
# 安装验证工具
npm install -g @apidevtools/swagger-cli

# 验证文档
swagger-cli validate docs/announcements-api.yaml
```

---

## 📦 导出其他格式

### 转换为 JSON

```bash
# 使用 js-yaml
npm install -g js-yaml

# 转换
js-yaml docs/announcements-api.yaml > docs/announcements-api.json
```

### 导出为 HTML

```bash
# 使用 redoc-cli
npm install -g redoc-cli

# 生成静态HTML
redoc-cli bundle docs/announcements-api.yaml \
  -o docs/api-docs.html \
  --title "公告API文档"
```

### 导出为 PDF

```bash
# 使用 wkhtmltopdf
wkhtmltopdf docs/api-docs.html docs/api-docs.pdf
```

---

## 🌐 分享文档

### 方法1：GitHub Pages

1. 将文档推送到 GitHub
2. 启用 GitHub Pages
3. 使用 Swagger UI 或 Redoc 展示

### 方法2：文档托管服务

- **SwaggerHub**: https://swaggerhub.com/
- **ReadMe**: https://readme.com/
- **Postman**: https://www.postman.com/

---

## 📚 参考资源

- **OpenAPI 规范**: https://swagger.io/specification/
- **Swagger Editor**: https://editor.swagger.io/
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **Redoc**: https://github.com/Redocly/redoc
- **OpenAPI Generator**: https://openapi-generator.tech/

---

## 🎉 使用示例

### 查看文档

```bash
# 在线查看
1. 访问 https://editor.swagger.io/
2. 导入 docs/announcements-api.yaml
3. 查看交互式文档
```

### 测试接口

```bash
# 在 Swagger Editor 中
1. 展开接口
2. 点击 "Try it out"
3. 填写参数
4. 点击 "Execute"
5. 查看响应
```

### 生成代码

```bash
# 生成客户端SDK
openapi-generator-cli generate \
  -i docs/announcements-api.yaml \
  -g javascript \
  -o sdk/javascript
```

---

**文档创建时间**: 2025-10-05  
**OpenAPI版本**: 3.0.3  
**文档版本**: 1.0.0

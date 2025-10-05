require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// 配置模块
const { logger, requestLogger } = require('./config/logger');

// 中间件
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, videoLimiter, adminLimiter } = require('./middleware/rateLimiter');

// 路由
const videoRoutes = require('./routes/videoRoutes');
const keyRoutes = require('./routes/keyRoutes');
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

// 创建Express应用
const app = express();

// 信任代理（获取真实IP）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false, // 关闭CSP，避免API调用问题
  crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000'] // 生产环境指定域名
    : true, // 开发环境允许所有域名
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use(requestLogger);

// 通用请求限制
app.use(generalLimiter);

// 路由配置
app.use('/api/video/parse', videoLimiter); // 视频解析接口专用限制
app.use('/api/video', videoRoutes);
app.use('/api/admin/keys', adminLimiter, keyRoutes); // 管理接口专用限制
app.use('/api/auth', authRoutes); // 用户认证接口
app.use('/api/announcements', announcementRoutes); // 公告接口

// 根路径
app.get('/', (req, res) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  res.json({
    code: 200,
    msg: '视频提取后端API服务',
    data: {
      name: 'video-extract-backend',
      version: '1.0.0',
      description: '基于Node.js的视频提取后端系统，支持多平台视频链接解析',
      author: 'Video Extract Team',
      documentation: {
        video_parse: '/api/video/parse',
        platforms: '/api/video/platforms',
        health: '/api/video/health',
        admin_keys: '/api/admin/keys'
      },
      timestamp: new Date().toISOString(),
      node_version: process.version,
      uptime: process.uptime()
    },
    debug: null,
    exec_time: (Date.now() - startTime) / 1000,
    user_ip: clientIp
  });
});

// API文档路径
app.get('/api', (req, res) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  res.json({
    code: 200,
    msg: 'API文档',
    data: {
      swagger_ui: '/api/docs',
      openapi_spec: '/api/openapi.json',
      video_apis: {
        parse: {
          method: 'POST',
          path: '/api/video/parse',
          description: '解析视频链接，支持抖音、B站、小红书等平台'
        },
        platforms: {
          method: 'GET',
          path: '/api/video/platforms',
          description: '获取支持的平台列表'
        },
        health: {
          method: 'GET',
          path: '/api/video/health',
          description: '健康检查接口'
        }
      },
      admin_apis: {
        get_keys: {
          method: 'GET',
          path: '/api/admin/keys',
          description: '获取API密钥列表'
        },
        create_key: {
          method: 'POST',
          path: '/api/admin/keys',
          description: '添加新的API密钥'
        },
        update_key: {
          method: 'PUT',
          path: '/api/admin/keys/:keyId',
          description: '更新指定的API密钥'
        },
        delete_key: {
          method: 'DELETE',
          path: '/api/admin/keys/:keyId',
          description: '删除指定的API密钥'
        },
        batch_update: {
          method: 'POST',
          path: '/api/admin/keys/batch/status',
          description: '批量更新密钥状态'
        }
      }
    },
    debug: null,
    exec_time: (Date.now() - startTime) / 1000,
    user_ip: clientIp
  });
});

// OpenAPI 规范文档
app.get('/api/openapi.json', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const openApiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs/openapi.json'), 'utf8'));
    res.json(openApiSpec);
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: 'OpenAPI文档加载失败',
      data: null,
      debug: process.env.NODE_ENV === 'development' ? error.message : null,
      exec_time: 0,
      user_ip: req.ip || req.connection.remoteAddress
    });
  }
});

// Swagger UI 文档页面
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>视频提取后端API文档</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <style>
        html {
          box-sizing: border-box;
          overflow: -moz-scrollbars-vertical;
          overflow-y: scroll;
        }
        *, *:before, *:after {
          box-sizing: inherit;
        }
        body {
          margin:0;
          background: #fafafa;
        }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/api/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 检查是否跳过数据库连接
    const skipDatabase = process.env.SKIP_DATABASE === 'true' || process.argv.includes('--skip-db');
    
    if (!skipDatabase) {
      // 动态导入数据库模块（避免启动时就报错）
      const { testConnection, initDatabase } = require('./config/database');
      
      // 测试数据库连接
      logger.info('正在测试数据库连接...');
      const dbConnected = await testConnection();
      
      if (!dbConnected) {
        logger.warn('数据库连接失败，将在无数据库模式下启动');
        logger.warn('请检查数据库配置，或使用 --skip-db 参数跳过数据库');
        logger.warn('无数据库模式下，密钥管理功能将不可用');
      } else {
        // 初始化数据库表
        logger.info('正在初始化数据库表...');
        const dbInitialized = await initDatabase();
        
        if (!dbInitialized) {
          logger.warn('数据库表初始化失败，但服务将继续启动');
        }
      }
    } else {
      logger.info('跳过数据库连接（--skip-db 模式）');
      logger.warn('密钥管理功能将不可用');
    }
    
    // 启动HTTP服务器
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`服务器启动成功! 端口: ${PORT}`);
      logger.info(`监听地址: ${HOST}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API地址: http://${HOST}:${PORT}/api`);
      logger.info(`健康检查: http://${HOST}:${PORT}/api/video/health`);
      
      if (skipDatabase || process.env.SKIP_DATABASE === 'true') {
        logger.warn('⚠️  当前运行在无数据库模式下');
        logger.warn('⚠️  密钥管理功能不可用');
        logger.warn('⚠️  请配置正确的数据库连接后重启服务');
      }
    });
    
    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，正在优雅关闭服务器...');
      server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，正在优雅关闭服务器...');
      server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动应用
if (require.main === module) {
  startServer();
}

module.exports = app;
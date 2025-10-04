const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

/**
 * 通用请求限制
 */
const generalLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 默认15分钟
  max: process.env.RATE_LIMIT_MAX || 100, // 默认每个窗口期最多100个请求
  message: {
    code: 429,
    msg: '请求过于频繁，请稍后再试',
    data: null,
    debug: null,
    exec_time: 0,
    user_ip: null
  },
  standardHeaders: true, // 返回标准的 `RateLimit` 头信息
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头信息
  skip: (req) => {
    // 跳过健康检查接口的限制
    return req.path === '/api/video/health';
  },
  keyGenerator: (req) => {
    // 使用IP地址作为限制键
    return req.ip || req.connection.remoteAddress;
  },

  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    res.status(429).json({
      code: 429,
      msg: '请求过于频繁，请稍后再试',
      data: null,
      debug: process.env.NODE_ENV === 'development' ? {
        limit: process.env.RATE_LIMIT_MAX || 100,
        window: `${process.env.RATE_LIMIT_WINDOW || 15}分钟`,
        ip: clientIp
      } : null,
      exec_time: 0,
      user_ip: clientIp
    });
  }
});

/**
 * 视频解析接口专用限制
 */
const videoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 每5分钟最多20次视频解析请求
  message: {
    code: 429,
    msg: '视频解析请求过于频繁，请稍后再试',
    data: null,
    debug: null,
    exec_time: 0,
    user_ip: null
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },

  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    res.status(429).json({
      code: 429,
      msg: '视频解析请求过于频繁，请稍后再试',
      data: null,
      debug: process.env.NODE_ENV === 'development' ? {
        limit: 20,
        window: '5分钟',
        ip: clientIp
      } : null,
      exec_time: 0,
      user_ip: clientIp
    });
  }
});

/**
 * 管理接口专用限制
 */
const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 50, // 每10分钟最多50次管理操作
  message: {
    code: 429,
    msg: '管理操作过于频繁，请稍后再试',
    data: null,
    debug: null,
    exec_time: 0,
    user_ip: null
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },

  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    res.status(429).json({
      code: 429,
      msg: '管理操作过于频繁，请稍后再试',
      data: null,
      debug: process.env.NODE_ENV === 'development' ? {
        limit: 50,
        window: '10分钟',
        ip: clientIp
      } : null,
      exec_time: 0,
      user_ip: clientIp
    });
  }
});

/**
 * 严格的请求限制（用于敏感操作）
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每小时最多10次
  message: {
    code: 429,
    msg: '操作过于频繁，请稍后再试',
    data: null,
    debug: null,
    exec_time: 0,
    user_ip: null
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

module.exports = {
  generalLimiter,
  videoLimiter,
  adminLimiter,
  strictLimiter
}; 
const { logger } = require('../config/logger');

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // 记录错误日志
  logger.error('全局错误处理:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    clientIp,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // 默认错误信息
  let statusCode = 500;
  let message = '服务器内部错误';
  let errorCode = 500;
  
  // 根据错误类型设置不同的响应
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 400;
    message = '数据验证失败';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 400;
    message = '数据格式错误';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorCode = 503;
    message = '服务暂时不可用';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 502;
    errorCode = 502;
    message = '外部服务无法访问';
  } else if (err.status || err.statusCode) {
    statusCode = err.status || err.statusCode;
    errorCode = statusCode;
    message = err.message || message;
  }
  
  // 防止响应被多次发送
  if (res.headersSent) {
    return next(err);
  }
  
  // 发送错误响应
  res.status(statusCode).json({
    code: errorCode,
    msg: message,
    data: null,
    debug: process.env.NODE_ENV === 'development' ? {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    } : null,
    exec_time: (Date.now() - startTime) / 1000,
    user_ip: clientIp
  });
}

/**
 * 404 错误处理中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function notFoundHandler(req, res, next) {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  logger.warn('404错误 - 路由不存在:', {
    url: req.url,
    method: req.method,
    clientIp
  });
  
  res.status(404).json({
    code: 404,
    msg: '请求的资源不存在',
    data: null,
    debug: process.env.NODE_ENV === 'development' ? {
      url: req.url,
      method: req.method
    } : null,
    exec_time: (Date.now() - startTime) / 1000,
    user_ip: clientIp
  });
}

/**
 * 异步错误捕获包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
}; 
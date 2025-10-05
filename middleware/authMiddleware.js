// middleware/authMiddleware.js - JWT 认证中间件
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

/**
 * JWT 认证中间件
 * 验证请求头中的 token，并将用户信息添加到 req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. 从请求头获取 token
    const authHeader = req.headers['authorization']
    
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        msg: '未提供认证令牌'
      })
    }
    
    // 2. 提取 token（格式：Bearer <token>）
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        msg: '认证令牌格式错误'
      })
    }
    
    // 3. 验证 token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // 4. 将用户信息添加到请求对象
    req.user = {
      userId: decoded.userId,
      openid: decoded.openid
    }
    
    // 5. 继续执行下一个中间件
    next()
    
  } catch (error) {
    console.error('❌ Token 验证失败:', error.message)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        msg: '无效的认证令牌'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        msg: '认证令牌已过期'
      })
    }
    
    return res.status(500).json({
      code: 500,
      msg: '认证验证失败'
    })
  }
}

module.exports = authMiddleware

const authService = require('../services/authService')
const { logger } = require('../config/logger')

class AuthController {
  // 微信登录
  async wxLogin(req, res) {
    const startTime = Date.now()
    
    try {
      const { loginCode, phoneCode } = req.body
      
      // 参数验证
      if (!loginCode) {
        return res.status(400).json({
          code: 400,
          msg: '缺少登录凭证',
          data: null,
          exec_time: Date.now() - startTime
        })
      }

      // 调用登录服务
      const result = await authService.wxLogin(loginCode, phoneCode)
      
      logger.info('微信登录成功', {
        openid: result.openid,
        hasPhone: !!result.phone,
        exec_time: Date.now() - startTime
      })

      res.json({
        code: 200,
        msg: '登录成功',
        data: result,
        exec_time: Date.now() - startTime
      })
    } catch (error) {
      logger.error('微信登录失败', {
        error: error.message,
        stack: error.stack,
        exec_time: Date.now() - startTime
      })

      res.status(500).json({
        code: 500,
        msg: error.message || '登录失败',
        data: null,
        exec_time: Date.now() - startTime
      })
    }
  }

  // 获取用户信息
  async getUserInfo(req, res) {
    const startTime = Date.now()
    
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({
          code: 401,
          msg: '未提供访问令牌',
          data: null,
          exec_time: Date.now() - startTime
        })
      }

      const userInfo = await authService.getUserInfo(token)
      
      res.json({
        code: 200,
        msg: '获取成功',
        data: userInfo,
        exec_time: Date.now() - startTime
      })
    } catch (error) {
      logger.error('获取用户信息失败', {
        error: error.message,
        exec_time: Date.now() - startTime
      })

      res.status(401).json({
        code: 401,
        msg: error.message || '获取用户信息失败',
        data: null,
        exec_time: Date.now() - startTime
      })
    }
  }

  // 刷新token
  async refreshToken(req, res) {
    const startTime = Date.now()
    
    try {
      const { refreshToken } = req.body
      
      if (!refreshToken) {
        return res.status(400).json({
          code: 400,
          msg: '缺少刷新令牌',
          data: null,
          exec_time: Date.now() - startTime
        })
      }

      const result = await authService.refreshToken(refreshToken)
      
      res.json({
        code: 200,
        msg: '刷新成功',
        data: result,
        exec_time: Date.now() - startTime
      })
    } catch (error) {
      logger.error('刷新token失败', {
        error: error.message,
        exec_time: Date.now() - startTime
      })

      res.status(401).json({
        code: 401,
        msg: error.message || '刷新失败',
        data: null,
        exec_time: Date.now() - startTime
      })
    }
  }
}

module.exports = new AuthController()
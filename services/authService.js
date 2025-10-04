const axios = require('axios')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { logger } = require('../config/logger')

class AuthService {
  constructor() {
    // 微信小程序配置 - 需要在环境变量中配置
    this.appId = process.env.WX_APPID || ''
    this.appSecret = process.env.WX_APP_SECRET || ''
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key'
    
    // 用户数据存储 (实际项目中应使用数据库)
    this.users = new Map()
    this.tokens = new Map()
  }

  // 微信登录
  async wxLogin(loginCode, phoneCode = null) {
    try {
      // 1. 使用 loginCode 获取 openid 和 session_key
      const sessionData = await this.code2Session(loginCode)
      
      let userInfo = {
        openid: sessionData.openid,
        sessionKey: sessionData.session_key,
        unionid: sessionData.unionid || null,
        phone: null,
        createTime: new Date(),
        lastLoginTime: new Date()
      }

      // 2. 如果有 phoneCode，获取手机号
      if (phoneCode) {
        try {
          const phoneInfo = await this.getPhoneNumber(phoneCode)
          userInfo.phone = phoneInfo.phone_info?.phoneNumber || null
        } catch (phoneError) {
          logger.warn('获取手机号失败', { error: phoneError.message })
          // 手机号获取失败不影响登录流程
        }
      }

      // 3. 检查用户是否存在，不存在则创建
      if (!this.users.has(userInfo.openid)) {
        this.users.set(userInfo.openid, userInfo)
        logger.info('创建新用户', { openid: userInfo.openid })
      } else {
        // 更新现有用户信息
        const existingUser = this.users.get(userInfo.openid)
        existingUser.lastLoginTime = new Date()
        if (userInfo.phone) {
          existingUser.phone = userInfo.phone
        }
        userInfo = existingUser
      }

      // 4. 生成自定义 token
      const token = this.generateToken(userInfo)
      const refreshToken = this.generateRefreshToken(userInfo)

      // 5. 存储 token
      this.tokens.set(token, {
        openid: userInfo.openid,
        createTime: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天过期
      })

      return {
        token,
        refreshToken,
        openid: userInfo.openid,
        phone: userInfo.phone,
        expiresIn: 7 * 24 * 60 * 60 // 7天，单位秒
      }
    } catch (error) {
      logger.error('微信登录失败', { error: error.message })
      throw new Error('登录失败: ' + error.message)
    }
  }

  // 调用微信 code2Session 接口
  async code2Session(code) {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
    const params = {
      appid: this.appId,
      secret: this.appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    }

    try {
      const response = await axios.get(url, { params })
      const data = response.data

      if (data.errcode) {
        throw new Error(`微信接口错误: ${data.errcode} - ${data.errmsg}`)
      }

      return {
        openid: data.openid,
        session_key: data.session_key,
        unionid: data.unionid
      }
    } catch (error) {
      logger.error('code2Session 调用失败', { error: error.message })
      throw error
    }
  }

  // 获取手机号
  async getPhoneNumber(phoneCode) {
    // 首先需要获取 access_token
    const accessToken = await this.getAccessToken()
    
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`
    
    try {
      const response = await axios.post(url, {
        code: phoneCode
      })
      
      const data = response.data
      
      if (data.errcode !== 0) {
        throw new Error(`获取手机号失败: ${data.errcode} - ${data.errmsg}`)
      }
      
      return data
    } catch (error) {
      logger.error('获取手机号失败', { error: error.message })
      throw error
    }
  }

  // 获取微信 access_token
  async getAccessToken() {
    const url = 'https://api.weixin.qq.com/cgi-bin/token'
    const params = {
      grant_type: 'client_credential',
      appid: this.appId,
      secret: this.appSecret
    }

    try {
      const response = await axios.get(url, { params })
      const data = response.data

      if (data.errcode) {
        throw new Error(`获取access_token失败: ${data.errcode} - ${data.errmsg}`)
      }

      return data.access_token
    } catch (error) {
      logger.error('获取access_token失败', { error: error.message })
      throw error
    }
  }

  // 生成 JWT token
  generateToken(userInfo) {
    const payload = {
      openid: userInfo.openid,
      phone: userInfo.phone,
      type: 'access_token'
    }
    
    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: '7d',
      issuer: 'video-extract-app'
    })
  }

  // 生成刷新 token
  generateRefreshToken(userInfo) {
    const payload = {
      openid: userInfo.openid,
      type: 'refresh_token'
    }
    
    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: '30d',
      issuer: 'video-extract-app'
    })
  }

  // 验证 token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret)
      
      // 检查 token 是否在存储中
      if (!this.tokens.has(token)) {
        throw new Error('Token 已失效')
      }
      
      const tokenInfo = this.tokens.get(token)
      if (new Date() > tokenInfo.expiresAt) {
        this.tokens.delete(token)
        throw new Error('Token 已过期')
      }
      
      return decoded
    } catch (error) {
      throw new Error('Token 验证失败: ' + error.message)
    }
  }

  // 获取用户信息
  async getUserInfo(token) {
    const decoded = this.verifyToken(token)
    const userInfo = this.users.get(decoded.openid)
    
    if (!userInfo) {
      throw new Error('用户不存在')
    }
    
    return {
      openid: userInfo.openid,
      phone: userInfo.phone,
      createTime: userInfo.createTime,
      lastLoginTime: userInfo.lastLoginTime
    }
  }

  // 刷新 token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret)
      
      if (decoded.type !== 'refresh_token') {
        throw new Error('无效的刷新令牌')
      }
      
      const userInfo = this.users.get(decoded.openid)
      if (!userInfo) {
        throw new Error('用户不存在')
      }
      
      // 生成新的 access token
      const newToken = this.generateToken(userInfo)
      const newRefreshToken = this.generateRefreshToken(userInfo)
      
      // 存储新 token
      this.tokens.set(newToken, {
        openid: userInfo.openid,
        createTime: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      
      return {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60
      }
    } catch (error) {
      throw new Error('刷新失败: ' + error.message)
    }
  }
}

module.exports = new AuthService()
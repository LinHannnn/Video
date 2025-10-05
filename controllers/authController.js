// controllers/authController.js - 微信登录控制器
const axios = require('axios')
const jwt = require('jsonwebtoken')
const db = require('../config/database')

// 微信小程序配置
const WX_CONFIG = {
  appId: process.env.WX_APPID || 'wx638ec29150825d0d',
  appSecret: process.env.WX_APPSECRET // 请在环境变量中配置
}

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const JWT_EXPIRES_IN = '7d' // token 有效期 7 天

// access_token 缓存
let cachedAccessToken = null
let tokenExpireTime = 0

/**
 * 获取微信 access_token
 * 用于调用微信获取手机号接口
 */
const getAccessToken = async () => {
  try {
    // 如果缓存的 token 还有效，直接返回
    if (cachedAccessToken && Date.now() < tokenExpireTime) {
      return cachedAccessToken
    }
    
    console.log('🔑 获取新的 access_token...')
    
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_CONFIG.appId}&secret=${WX_CONFIG.appSecret}`
    
    const response = await axios.get(url)
    
    if (response.data.access_token) {
      cachedAccessToken = response.data.access_token
      // 提前 5 分钟过期，确保不会使用过期的 token
      tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000
      
      console.log('✅ access_token 获取成功')
      return cachedAccessToken
    }
    
    throw new Error(`获取 access_token 失败: ${response.data.errmsg || '未知错误'}`)
  } catch (error) {
    console.error('❌ 获取 access_token 失败:', error.message)
    throw error
  }
}

/**
 * 微信登录接口
 * POST /auth/login
 */
exports.login = async (req, res) => {
  const startTime = Date.now()
  
  try {
    const { loginCode, phoneCode } = req.body
    
    // 1. 验证参数
    if (!loginCode) {
      return res.status(400).json({
        code: 400,
        msg: '缺少登录凭证 loginCode',
        exec_time: (Date.now() - startTime) / 1000
      })
    }
    
    console.log('🔐 开始登录流程...')
    console.log('📋 loginCode:', loginCode)
    console.log('📱 phoneCode:', phoneCode ? '已提供' : '未提供')
    
    // 2. 调用微信接口，用 code 换取 openid 和 session_key
    const wxLoginUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_CONFIG.appId}&secret=${WX_CONFIG.appSecret}&js_code=${loginCode}&grant_type=authorization_code`
    
    const wxResponse = await axios.get(wxLoginUrl, { timeout: 10000 })
    const { openid, session_key, unionid, errcode, errmsg } = wxResponse.data
    
    if (errcode) {
      console.error('❌ 微信登录失败:', errcode, errmsg)
      return res.status(400).json({
        code: 400,
        msg: `微信登录失败: ${errmsg}`,
        exec_time: (Date.now() - startTime) / 1000
      })
    }
    
    if (!openid) {
      return res.status(400).json({
        code: 400,
        msg: '未获取到用户 openid',
        exec_time: (Date.now() - startTime) / 1000
      })
    }
    
    console.log('✅ 获取 openid 成功:', openid)
    
    // 3. 如果提供了 phoneCode，获取手机号
    let phoneNumber = null
    if (phoneCode) {
      try {
        console.log('📱 开始获取手机号...')
        
        // 获取 access_token
        const accessToken = await getAccessToken()
        
        // 调用微信接口获取手机号
        const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`
        
        const phoneResponse = await axios.post(phoneUrl, {
          code: phoneCode
        }, { timeout: 10000 })
        
        console.log('📱 微信手机号接口响应:', phoneResponse.data)
        
        if (phoneResponse.data.errcode === 0 && phoneResponse.data.phone_info) {
          phoneNumber = phoneResponse.data.phone_info.phoneNumber
          console.log('✅ 手机号获取成功:', phoneNumber)
        } else {
          console.warn('⚠️ 获取手机号失败:', phoneResponse.data.errmsg)
        }
      } catch (phoneError) {
        console.error('❌ 获取手机号异常:', phoneError.message)
        // 手机号获取失败不影响登录流程，继续执行
      }
    }
    
    // 4. 查找或创建用户
    let user
    
    try {
      // 查询用户是否存在
      const rows = await db.query(
        'SELECT * FROM users WHERE openid = ?',
        [openid]
      )
      
      if (rows.length > 0) {
        // 用户已存在，更新信息
        user = rows[0]
        
        await db.query(
          'UPDATE users SET phone = COALESCE(?, phone), last_login_time = NOW(), login_count = login_count + 1 WHERE openid = ?',
          [phoneNumber, openid]
        )
        
        // 如果更新了手机号，更新本地对象
        if (phoneNumber) {
          user.phone = phoneNumber
        }
        
        console.log('✅ 用户已存在，更新登录信息')
      } else {
        // 创建新用户
        const result = await db.query(
          'INSERT INTO users (openid, phone, created_at, last_login_time, login_count) VALUES (?, ?, NOW(), NOW(), 1)',
          [openid, phoneNumber]
        )
        
        user = {
          id: result.insertId,
          openid,
          phone: phoneNumber
        }
        
        console.log('✅ 创建新用户:', user.id)
      }
    } catch (dbError) {
      console.error('❌ 数据库操作失败:', dbError.message)
      // 如果数据库操作失败，返回临时用户信息（仅用于测试）
      user = {
        id: 0,
        openid,
        phone: phoneNumber
      }
    }
    
    // 5. 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        openid: user.openid 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    console.log('✅ Token 生成成功')
    
    // 6. 返回登录结果
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        openid: user.openid,
        phone: user.phone,
        userId: user.id
      },
      exec_time: (Date.now() - startTime) / 1000
    })
    
    console.log('🎉 登录流程完成')
    
  } catch (error) {
    console.error('❌ 登录失败:', error)
    
    // 返回详细的错误信息（生产环境应该隐藏详细错误）
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    res.status(500).json({
      code: 500,
      msg: '登录失败',
      error: isDevelopment ? error.message : undefined,
      debug: isDevelopment ? error.stack : undefined,
      exec_time: (Date.now() - startTime) / 1000
    })
  }
}

/**
 * 获取用户信息接口
 * GET /auth/userinfo
 * 需要在请求头中携带 token
 */
exports.getUserInfo = async (req, res) => {
  const startTime = Date.now()
  
  try {
    // token 已在中间件中验证，用户信息在 req.user 中
    const { userId } = req.user
    
    // 查询用户信息
    const [rows] = await db.query(
      'SELECT id, openid, phone, created_at, last_login_time, login_count FROM users WHERE id = ?',
      [userId]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        exec_time: (Date.now() - startTime) / 1000
      })
    }
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: rows[0],
      exec_time: (Date.now() - startTime) / 1000
    })
    
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error)
    res.status(500).json({
      code: 500,
      msg: '获取用户信息失败',
      exec_time: (Date.now() - startTime) / 1000
    })
  }
}

/**
 * 刷新 token 接口
 * POST /auth/refresh
 */
exports.refreshToken = async (req, res) => {
  const startTime = Date.now()
  
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        msg: '缺少 refreshToken',
        exec_time: (Date.now() - startTime) / 1000
      })
    }
    
    // 验证 refreshToken
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    
    // 生成新的 token
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        openid: decoded.openid 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    res.json({
      code: 200,
      msg: 'Token 刷新成功',
      data: {
        token: newToken
      },
      exec_time: (Date.now() - startTime) / 1000
    })
    
  } catch (error) {
    console.error('❌ Token 刷新失败:', error)
    res.status(401).json({
      code: 401,
      msg: 'Token 无效或已过期',
      exec_time: (Date.now() - startTime) / 1000
    })
  }
}

/**
 * 退出登录接口
 * POST /auth/logout
 */
exports.logout = async (req, res) => {
  const startTime = Date.now()
  
  try {
    // 这里可以将 token 加入黑名单（如果实现了 token 黑名单机制）
    
    res.json({
      code: 200,
      msg: '退出登录成功',
      exec_time: (Date.now() - startTime) / 1000
    })
    
  } catch (error) {
    console.error('❌ 退出登录失败:', error)
    res.status(500).json({
      code: 500,
      msg: '退出登录失败',
      exec_time: (Date.now() - startTime) / 1000
    })
  }
}

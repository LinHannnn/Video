// utils/auth.js
const api = require('./api.js')

/**
 * 获取本地存储的 token
 */
const getToken = () => {
  return wx.getStorageSync('token') || ''
}

/**
 * 设置 token
 */
const setToken = (token) => {
  wx.setStorageSync('token', token)
}

/**
 * 移除 token
 */
const removeToken = () => {
  wx.removeStorageSync('token')
}

/**
 * 检查是否已登录
 */
const isLoggedIn = () => {
  const token = getToken()
  return !!token
}

/**
 * 获取微信登录 code
 */
const getWxLoginCode = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('获取登录 code 成功:', res.code)
          resolve(res.code)
        } else {
          reject(new Error('获取登录凭证失败'))
        }
      },
      fail: (err) => {
        console.error('wx.login 失败:', err)
        reject(new Error('微信登录失败'))
      }
    })
  })
}

/**
 * 完整的微信登录流程
 * @param {string} phoneCode - 手机号授权 code（可选）
 */
const login = async (phoneCode = null) => {
  try {
    // 1. 获取微信登录 code
    console.log('🔐 开始微信登录流程...')
    const loginCode = await getWxLoginCode()
    
    // 2. 调用后端登录接口
    console.log('📡 调用后端登录接口...')
    const result = await api.wxLogin(loginCode, phoneCode)
    
    if (result.code === 200 && result.data) {
      // 3. 保存 token
      setToken(result.data.token)
      
      // 4. 保存用户信息到全局
      const app = getApp()
      app.globalData.userInfo = {
        openid: result.data.openid,
        phone: result.data.phone,
        isLoggedIn: true
      }
      
      console.log('✅ 登录成功:', result.data)
      return {
        success: true,
        data: result.data
      }
    } else {
      throw new Error(result.msg || '登录失败')
    }
  } catch (error) {
    console.error('❌ 登录失败:', error)
    return {
      success: false,
      error: error.message || '登录失败'
    }
  }
}

/**
 * 显示登录授权弹窗
 * 返回一个 Promise，用户授权后自动完成登录流程
 */
const showLoginModal = () => {
  return new Promise((resolve, reject) => {
    // 显示授权弹窗提示
    wx.showModal({
      title: '登录提示',
      content: '为了给您提供更好的服务，需要获取您的登录信息',
      confirmText: '立即登录',
      cancelText: '暂不登录',
      success: async (res) => {
        if (res.confirm) {
          // 用户点击确认，触发登录流程
          // 注意：这里只是先进行基础登录，手机号授权需要通过 button 组件触发
          const result = await login()
          if (result.success) {
            resolve(result.data)
          } else {
            reject(new Error(result.error))
          }
        } else {
          // 用户取消
          reject(new Error('用户取消登录'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 退出登录
 */
const logout = () => {
  removeToken()
  const app = getApp()
  app.globalData.userInfo = null
  console.log('👋 已退出登录')
}

/**
 * 获取用户信息
 */
const getUserInfo = async () => {
  try {
    const token = getToken()
    if (!token) {
      throw new Error('未登录')
    }
    
    const result = await api.getUserInfo()
    return result.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  isLoggedIn,
  getWxLoginCode,
  login,
  showLoginModal,
  logout,
  getUserInfo
} 
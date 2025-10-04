// utils/api.js
const app = getApp()

// 简化的网络检查函数
const checkNetwork = () => {
  return new Promise((resolve, reject) => {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          reject(new Error('网络未连接'))
        } else {
          resolve(res.networkType)
        }
      },
      fail: reject
    })
  })
}

// 获取当前环境配置
const getConfig = () => {
  try {
    const accountInfo = wx.getAccountInfoSync()
    const systemInfo = wx.getSystemInfoSync()
    const isSimulator = systemInfo.platform === 'devtools'
    
    if (isSimulator) {
      // 开发工具环境 - 使用 127.0.0.1 而不是 localhost
      return {
        baseUrl: 'http://127.0.0.1:3000/api',
        debug: true,
        timeout: 10000
      }
    } else {
      // 真机调试环境 - 请修改下面的IP地址为您的电脑IP
      return {
        baseUrl: 'http://192.168.1.5:3000/api', // 电脑局域网IP地址
        debug: true,
        timeout: 15000
      }
    }
  } catch (error) {
    console.error('获取环境配置失败:', error)
    // 默认配置
    return {
      baseUrl: 'http://localhost:3000/api',
      debug: true,
      timeout: 10000
    }
  }
}

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const config = getConfig()
    const requestUrl = `${config.baseUrl}${url}`
    
    // 获取本地存储的 token
    const token = wx.getStorageSync('token')
    
    console.log('🌐 API请求:', {
      url: requestUrl,
      method: options.method || 'GET',
      data: options.data,
      hasToken: !!token
    })
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    // 如果有 token，添加到请求头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    wx.request({
      url: requestUrl,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: config.timeout,
      header: headers,
      success: (res) => {
        console.log('✅ API响应:', res)
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 失效，清除本地 token
          wx.removeStorageSync('token')
          const error = new Error('登录已过期，请重新登录')
          error.statusCode = res.statusCode
          error.data = res.data
          reject(error)
        } else {
          const error = new Error(`请求失败: ${res.statusCode}`)
          error.statusCode = res.statusCode
          error.data = res.data
          reject(error)
        }
      },
      fail: (err) => {
        console.error('❌ API请求失败:', err)
        
        // 根据错误类型提供不同的错误信息
        let errorMessage = '网络请求失败'
        
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请检查网络连接'
          } else if (err.errMsg.includes('fail')) {
            if (err.errMsg.includes('ERR_CONNECTION_REFUSED')) {
              errorMessage = '无法连接到服务器，请检查服务器状态'
            } else if (err.errMsg.includes('ERR_NETWORK')) {
              errorMessage = '网络错误，请检查网络连接'
            } else {
              errorMessage = '连接失败，请稍后重试'
            }
          }
        }
        
        const error = new Error(errorMessage)
        error.originalError = err
        reject(error)
      }
    })
  })
}

// 视频解析API
const parseVideo = async (url) => {
  try {
    // 先检查网络状态
    await checkNetwork()
    
    return await request('/video/parse', {
      method: 'POST',
      data: { url }
    })
  } catch (error) {
    console.error('视频解析失败:', error)
    throw error
  }
}

// 获取支持的平台列表
const getSupportedPlatforms = async () => {
  try {
    return await request('/video/platforms')
  } catch (error) {
    console.error('获取平台列表失败:', error)
    throw error
  }
}

// 健康检查
const healthCheck = async () => {
  try {
    return await request('/video/health')
  } catch (error) {
    console.error('健康检查失败:', error)
    throw error
  }
}

// API连接诊断
const diagnoseConnection = async () => {
  const results = {
    network: null,
    api: null,
    environment: null
  }
  
  try {
    // 1. 检查网络
    results.network = await checkNetwork()
    console.log('✅ 网络检查通过:', results.network)
  } catch (error) {
    results.network = error.message
    console.error('❌ 网络检查失败:', error)
  }
  
  try {
    // 2. 检查环境配置
    const config = getConfig()
    results.environment = config
    console.log('✅ 环境配置正常:', config)
  } catch (error) {
    results.environment = error.message
    console.error('❌ 环境配置错误:', error)
  }
  
  try {
    // 3. 检查API连接
    await healthCheck()
    results.api = 'connected'
    console.log('✅ API连接正常')
  } catch (error) {
    results.api = error.message
    console.error('❌ API连接失败:', error)
  }
  
  return results
}

// ============ 登录相关接口 ============

// 微信登录
const wxLogin = async (loginCode, phoneCode = null) => {
  try {
    return await request('/auth/login', {
      method: 'POST',
      data: { loginCode, phoneCode }
    })
  } catch (error) {
    console.error('微信登录失败:', error)
    throw error
  }
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    return await request('/auth/userinfo', {
      method: 'GET'
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

// 刷新 token
const refreshToken = async (refreshToken) => {
  try {
    return await request('/auth/refresh', {
      method: 'POST',
      data: { refreshToken }
    })
  } catch (error) {
    console.error('刷新token失败:', error)
    throw error
  }
}

module.exports = {
  parseVideo,
  getSupportedPlatforms,
  healthCheck,
  diagnoseConnection,
  // 登录相关
  wxLogin,
  getUserInfo,
  refreshToken
} 
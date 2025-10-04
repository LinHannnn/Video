// config/env.js - 环境配置文件

// 获取本机IP地址的方法（需要手动设置）
const getLocalIP = () => {
  // 请将此处替换为您电脑的实际IP地址
  // 在命令行运行 ipconfig (Windows) 或 ifconfig (Mac/Linux) 查看IP
  return '192.168.1.1' // 请修改为您的实际IP地址
}

// 环境配置
const ENV_CONFIG = {
  // 开发环境 - 微信开发者工具
  development: {
    baseUrl: 'http://localhost:3000/api',
    debug: true,
    timeout: 10000
  },
  
  // 真机调试环境 - 手机访问
  device: {
    baseUrl: `http://${getLocalIP()}:3000/api`,
    debug: true,
    timeout: 15000
  },
  
  // 生产环境 - 正式服务器
  production: {
    baseUrl: 'https://your-domain.com/api', // 替换为您的生产环境域名
    debug: false,
    timeout: 30000
  }
}

// 自动检测当前环境
const getCurrentEnv = () => {
  const accountInfo = wx.getAccountInfoSync()
  const miniProgram = accountInfo.miniProgram
  
  // 判断是否为开发版本
  if (miniProgram.envVersion === 'develop') {
    // 进一步判断是否为真机调试
    const systemInfo = wx.getSystemInfoSync()
    const isSimulator = systemInfo.platform === 'devtools'
    
    if (isSimulator) {
      console.log('🔧 当前环境：开发工具')
      return 'development'
    } else {
      console.log('📱 当前环境：真机调试')
      return 'device'
    }
  } else if (miniProgram.envVersion === 'trial') {
    console.log('🧪 当前环境：体验版')
    return 'device'
  } else {
    console.log('🚀 当前环境：正式版')
    return 'production'
  }
}

// 获取当前环境配置
const getConfig = () => {
  const env = getCurrentEnv()
  const config = ENV_CONFIG[env]
  
  console.log(`📋 环境配置 [${env}]:`, config)
  return config
}

// 网络检测
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

// 测试API连接
const testConnection = (baseUrl) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}/health`,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(true)
        } else {
          reject(new Error(`服务器响应错误: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`连接失败: ${err.errMsg}`))
      }
    })
  })
}

module.exports = {
  getConfig,
  getCurrentEnv,
  checkNetwork,
  testConnection,
  ENV_CONFIG
} 
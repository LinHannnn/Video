// scripts/test-wechat-login.js - 微信登录功能测试脚本
require('dotenv').config()
const axios = require('axios')

// 配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

// 日志辅助函数
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
}

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0
}

// 测试用例
async function runTests() {
  console.log('\n🧪 开始测试微信登录功能...\n')
  console.log('=' .repeat(60))
  
  // 检查环境配置
  await testEnvironmentConfig()
  
  // 测试 API 连接
  await testApiConnection()
  
  // 测试登录接口结构
  await testLoginEndpoint()
  
  // 测试 JWT 认证
  await testJWTAuth()
  
  // 测试获取用户信息
  await testGetUserInfo()
  
  // 显示测试结果
  displayResults()
}

// 测试1：检查环境配置
async function testEnvironmentConfig() {
  results.total++
  console.log('\n📋 测试1: 检查环境配置')
  console.log('-'.repeat(60))
  
  try {
    const requiredVars = ['WX_APPID', 'WX_APPSECRET', 'JWT_SECRET']
    const missing = []
    
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        log.success(`${varName}: 已配置`)
      } else {
        log.error(`${varName}: 未配置`)
        missing.push(varName)
      }
    })
    
    if (missing.length === 0) {
      log.success('环境配置检查通过')
      results.passed++
    } else {
      log.error(`缺少配置项: ${missing.join(', ')}`)
      results.failed++
    }
  } catch (error) {
    log.error(`环境配置检查失败: ${error.message}`)
    results.failed++
  }
}

// 测试2：API 连接
async function testApiConnection() {
  results.total++
  console.log('\n🌐 测试2: API 连接测试')
  console.log('-'.repeat(60))
  
  try {
    const response = await axios.get(`${BASE_URL}/api/video/health`, {
      timeout: 5000
    })
    
    if (response.status === 200) {
      log.success(`API 连接成功: ${BASE_URL}`)
      log.info(`响应时间: ${response.data.exec_time || 'N/A'}s`)
      results.passed++
    } else {
      log.error(`API 响应异常: ${response.status}`)
      results.failed++
    }
  } catch (error) {
    log.error(`API 连接失败: ${error.message}`)
    log.warning('请确保后端服务正在运行（npm start）')
    results.failed++
  }
}

// 测试3：登录接口结构
async function testLoginEndpoint() {
  results.total++
  console.log('\n🔐 测试3: 登录接口结构测试')
  console.log('-'.repeat(60))
  
  try {
    // 测试缺少参数的情况
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      // 故意不传 loginCode
    }, {
      timeout: 5000,
      validateStatus: () => true // 接受所有状态码
    })
    
    if (response.status === 400) {
      log.success('登录接口正确处理了缺少参数的情况')
      
      if (response.data.msg && response.data.msg.includes('loginCode')) {
        log.success('错误提示信息正确')
        results.passed++
      } else {
        log.warning('错误提示信息不够明确')
        results.passed++
      }
    } else {
      log.error(`预期状态码 400，实际收到 ${response.status}`)
      results.failed++
    }
  } catch (error) {
    log.error(`登录接口测试失败: ${error.message}`)
    results.failed++
  }
}

// 测试4：JWT 认证
async function testJWTAuth() {
  results.total++
  console.log('\n🔒 测试4: JWT 认证测试')
  console.log('-'.repeat(60))
  
  try {
    // 测试无 token 访问受保护的接口
    const response = await axios.get(`${BASE_URL}/api/auth/userinfo`, {
      timeout: 5000,
      validateStatus: () => true
    })
    
    if (response.status === 401) {
      log.success('JWT 认证中间件正常工作')
      
      if (response.data.msg && response.data.msg.includes('认证')) {
        log.success('认证错误提示正确')
        results.passed++
      } else {
        log.warning('认证错误提示不够明确')
        results.passed++
      }
    } else {
      log.error(`预期状态码 401，实际收到 ${response.status}`)
      results.failed++
    }
  } catch (error) {
    log.error(`JWT 认证测试失败: ${error.message}`)
    results.failed++
  }
}

// 测试5：获取用户信息
async function testGetUserInfo() {
  results.total++
  console.log('\n👤 测试5: 获取用户信息接口')
  console.log('-'.repeat(60))
  
  try {
    // 测试无效 token
    const response = await axios.get(`${BASE_URL}/api/auth/userinfo`, {
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      },
      timeout: 5000,
      validateStatus: () => true
    })
    
    if (response.status === 401) {
      log.success('无效 token 被正确拒绝')
      results.passed++
    } else {
      log.error(`预期状态码 401，实际收到 ${response.status}`)
      results.failed++
    }
  } catch (error) {
    log.error(`用户信息接口测试失败: ${error.message}`)
    results.failed++
  }
}

// 显示测试结果
function displayResults() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试结果汇总')
  console.log('='.repeat(60))
  
  console.log(`\n总测试数: ${results.total}`)
  log.success(`通过: ${results.passed}`)
  if (results.failed > 0) {
    log.error(`失败: ${results.failed}`)
  }
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1)
  console.log(`\n通过率: ${passRate}%`)
  
  if (results.failed === 0) {
    log.success('\n🎉 所有测试通过！微信登录功能已准备就绪！')
    console.log('\n下一步：')
    console.log('1. 在微信开发者工具中测试真实登录流程')
    console.log('2. 配置微信小程序后台的服务器域名')
    console.log('3. 开通手机号快速验证权限（企业小程序）')
  } else {
    log.warning('\n⚠️  部分测试未通过，请检查上述错误')
    console.log('\n常见问题：')
    console.log('1. 确保后端服务正在运行（npm start）')
    console.log('2. 检查 .env 文件配置是否正确')
    console.log('3. 确认数据库连接正常')
  }
  
  console.log('\n' + '='.repeat(60))
}

// 运行测试
runTests().catch(error => {
  console.error('\n测试执行出错:', error)
  process.exit(1)
})

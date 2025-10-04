/**
 * API测试脚本
 * 用于测试视频提取后端系统的各个接口
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试配置
const testConfig = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * 执行API测试
 */
async function runTests() {
  console.log('🚀 开始API测试...\n');
  
  try {
    // 1. 测试健康检查
    await testHealthCheck();
    
    // 2. 测试获取支持的平台
    await testGetPlatforms();
    
    // 3. 测试密钥管理
    await testKeyManagement();
    
    // 4. 测试视频解析（需要有效的API密钥）
    // await testVideoParser();
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

/**
 * 测试健康检查接口
 */
async function testHealthCheck() {
  console.log('🔍 测试健康检查接口...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/video/health`, testConfig);
    
    if (response.data.code === 200) {
      console.log('✅ 健康检查通过');
      console.log(`   服务版本: ${response.data.data.version}`);
      console.log(`   Node版本: ${response.data.data.node_version}`);
      console.log(`   运行时间: ${Math.floor(response.data.data.uptime)}秒`);
    } else {
      throw new Error('健康检查失败');
    }
  } catch (error) {
    throw new Error(`健康检查接口测试失败: ${error.message}`);
  }
}

/**
 * 测试获取支持的平台列表
 */
async function testGetPlatforms() {
  console.log('\n🔍 测试获取支持的平台...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/video/platforms`, testConfig);
    
    if (response.data.code === 200 && response.data.data.platforms) {
      console.log('✅ 获取平台列表成功');
      console.log(`   支持的平台数量: ${response.data.data.total}`);
      response.data.data.platforms.forEach(platform => {
        console.log(`   - ${platform.name} (${platform.key})`);
      });
    } else {
      throw new Error('获取平台列表失败');
    }
  } catch (error) {
    throw new Error(`平台列表接口测试失败: ${error.message}`);
  }
}

/**
 * 测试密钥管理接口
 */
async function testKeyManagement() {
  console.log('\n🔍 测试密钥管理接口...');
  
  let createdKeyId = null;
  
  try {
    // 1. 获取密钥列表
    console.log('   测试获取密钥列表...');
    const listResponse = await axios.get(`${BASE_URL}/api/admin/keys`, testConfig);
    
    if (listResponse.data.code === 200) {
      console.log(`   ✅ 获取密钥列表成功，当前有 ${listResponse.data.data.length} 个密钥`);
    } else {
      throw new Error('获取密钥列表失败');
    }
    
    // 2. 创建测试密钥
    console.log('   测试创建密钥...');
    const createData = {
      keyName: `测试密钥_${Date.now()}`,
      keyValue: `test_key_${Math.random().toString(36).substr(2, 9)}`,
      description: '这是一个测试密钥'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/admin/keys`, createData, testConfig);
    
    if (createResponse.data.code === 200) {
      createdKeyId = createResponse.data.data.id;
      console.log(`   ✅ 创建密钥成功，ID: ${createdKeyId}`);
    } else {
      throw new Error('创建密钥失败');
    }
    
    // 3. 更新密钥
    console.log('   测试更新密钥...');
    const updateData = {
      description: '这是一个更新后的测试密钥',
      status: 'inactive'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/admin/keys/${createdKeyId}`, updateData, testConfig);
    
    if (updateResponse.data.code === 200) {
      console.log('   ✅ 更新密钥成功');
    } else {
      throw new Error('更新密钥失败');
    }
    
    // 4. 获取单个密钥详情
    console.log('   测试获取密钥详情...');
    const detailResponse = await axios.get(`${BASE_URL}/api/admin/keys/${createdKeyId}`, testConfig);
    
    if (detailResponse.data.code === 200) {
      console.log('   ✅ 获取密钥详情成功');
      console.log(`   密钥状态: ${detailResponse.data.data.status}`);
    } else {
      throw new Error('获取密钥详情失败');
    }
    
    // 5. 删除测试密钥
    console.log('   测试删除密钥...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/admin/keys/${createdKeyId}`, testConfig);
    
    if (deleteResponse.data.code === 200) {
      console.log('   ✅ 删除密钥成功');
    } else {
      throw new Error('删除密钥失败');
    }
    
  } catch (error) {
    // 如果创建了密钥但后续测试失败，尝试清理
    if (createdKeyId) {
      try {
        await axios.delete(`${BASE_URL}/api/admin/keys/${createdKeyId}`, testConfig);
        console.log('   🧹 清理测试密钥成功');
      } catch (cleanupError) {
        console.log('   ⚠️ 清理测试密钥失败，请手动删除');
      }
    }
    throw new Error(`密钥管理接口测试失败: ${error.message}`);
  }
}

/**
 * 测试视频解析接口（需要有效的API密钥）
 */
async function testVideoParser() {
  console.log('\n🔍 测试视频解析接口...');
  
  try {
    // 测试URL验证
    const invalidUrlData = {
      url: 'invalid-url',
      platform: 'auto'
    };
    
    try {
      await axios.post(`${BASE_URL}/api/video/parse`, invalidUrlData, testConfig);
      throw new Error('应该返回验证错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ URL验证正常工作');
      } else {
        throw error;
      }
    }
    
    // 测试不支持的平台
    const unsupportedPlatformData = {
      url: 'https://example.com/video',
      platform: 'auto'
    };
    
    try {
      await axios.post(`${BASE_URL}/api/video/parse`, unsupportedPlatformData, testConfig);
      throw new Error('应该返回不支持的平台错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ 平台验证正常工作');
      } else {
        throw error;
      }
    }
    
    console.log('   ⚠️ 注意: 实际视频解析测试需要有效的API密钥');
    
  } catch (error) {
    throw new Error(`视频解析接口测试失败: ${error.message}`);
  }
}

/**
 * 测试API文档接口
 */
async function testApiDocs() {
  console.log('\n🔍 测试API文档...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api`, testConfig);
    
    if (response.data.code === 200) {
      console.log('✅ API文档获取成功');
    } else {
      throw new Error('API文档获取失败');
    }
  } catch (error) {
    throw new Error(`API文档测试失败: ${error.message}`);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testHealthCheck,
  testGetPlatforms,
  testKeyManagement,
  testVideoParser
}; 
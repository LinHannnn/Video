#!/usr/bin/env node

require('dotenv').config();
const keyService = require('../services/keyService');
const { initDatabase } = require('../config/database');

async function addApiKey() {
  try {
    console.log('初始化数据库...');
    await initDatabase();
    
    console.log('添加第三方API密钥...');
    
    // 添加52api.cn的API密钥
    const keyData = {
      keyName: '52api_default',
      keyValue: '52api', // 这是示例密钥，需要用户替换为真实密钥
      description: '52api.cn视频解析API密钥 - 请替换为您的真实密钥'
    };
    
    try {
      const keyId = await keyService.createKey(keyData);
      console.log(`✅ API密钥添加成功，ID: ${keyId}`);
      console.log(`⚠️  请记得将密钥值 '${keyData.keyValue}' 替换为您在52api.cn获取的真实密钥`);
    } catch (error) {
      if (error.message.includes('密钥名称已存在')) {
        console.log('⚠️  密钥已存在，跳过添加');
      } else {
        throw error;
      }
    }
    
    // 显示所有现有密钥
    console.log('\n当前所有API密钥:');
    const allKeys = await keyService.getAllKeys();
    allKeys.forEach(key => {
      console.log(`- ID: ${key.id}, 名称: ${key.key_name}, 状态: ${key.status}, 值: ${key.key_value}`);
    });
    
    console.log('\n🎉 脚本执行完成！');
    console.log('\n📝 使用说明:');
    console.log('1. 请前往 https://www.52api.cn 注册账号并获取API密钥');
    console.log('2. 使用 POST /api/keys 接口或直接修改数据库来更新密钥值');
    console.log('3. 确保至少有一个状态为 "active" 的密钥才能进行视频解析');
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// 如果直接运行此脚本
if (require.main === module) {
  addApiKey();
}

module.exports = { addApiKey }; 
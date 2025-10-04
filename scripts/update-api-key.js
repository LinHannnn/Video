#!/usr/bin/env node

require('dotenv').config();
const keyService = require('../services/keyService');

async function updateApiKey() {
  try {
    // 从命令行参数获取新的密钥值
    const newKeyValue = process.argv[2];
    
    if (!newKeyValue) {
      console.log('❌ 请提供新的API密钥值');
      console.log('💡 使用方法: node scripts/update-api-key.js <your_api_key>');
      console.log('💡 示例: node scripts/update-api-key.js your_real_52api_key');
      process.exit(1);
    }
    
    console.log('🔍 查找现有的API密钥...');
    
    // 获取所有密钥
    const allKeys = await keyService.getAllKeys();
    console.log(`📋 找到 ${allKeys.length} 个密钥`);
    
    if (allKeys.length === 0) {
      console.log('❌ 没有找到任何API密钥，请先运行 add-api-key.js');
      process.exit(1);
    }
    
    // 更新第一个密钥（通常是默认密钥）
    const keyToUpdate = allKeys[0];
    console.log(`🔄 更新密钥: ${keyToUpdate.key_name} (ID: ${keyToUpdate.id})`);
    
    await keyService.updateKey(keyToUpdate.id, {
      keyValue: newKeyValue,
      description: `52api.cn视频解析API密钥 - 已更新于 ${new Date().toLocaleString()}`
    });
    
    console.log('✅ API密钥更新成功！');
    
    // 显示更新后的密钥信息
    console.log('\n📋 当前所有API密钥:');
    const updatedKeys = await keyService.getAllKeys();
    updatedKeys.forEach(key => {
      console.log(`- ID: ${key.id}, 名称: ${key.key_name}, 状态: ${key.status}`);
      console.log(`  值: ${key.key_value}`);
      console.log(`  描述: ${key.description}`);
    });
    
    console.log('\n🎉 现在您可以测试视频解析功能了！');
    console.log('💡 运行: node test-video-parse.js');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// 如果直接运行此脚本
if (require.main === module) {
  updateApiKey();
}

module.exports = { updateApiKey }; 
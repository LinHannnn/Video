/**
 * 修复用户表结构脚本
 * 添加缺失的字段
 */

require('dotenv').config()
const db = require('../config/database')

async function fixUsersTable() {
  let connection
  
  try {
    console.log('\n🔧 开始检查并修复用户表结构...\n')
    
    connection = await db.pool.getConnection()
    
    // 1. 检查表是否存在
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'")
    
    if (tables.length === 0) {
      console.log('❌ users 表不存在，正在创建...')
      
      // 创建完整的表
      await connection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
          openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
          unionid VARCHAR(100) DEFAULT NULL COMMENT '微信unionid',
          phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
          nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
          avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
          gender TINYINT DEFAULT 0 COMMENT '性别',
          country VARCHAR(50) DEFAULT NULL COMMENT '国家',
          province VARCHAR(50) DEFAULT NULL COMMENT '省份',
          city VARCHAR(50) DEFAULT NULL COMMENT '城市',
          language VARCHAR(20) DEFAULT NULL COMMENT '语言',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
          last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后登录时间',
          login_count INT DEFAULT 0 COMMENT '登录次数',
          parse_count INT DEFAULT 0 COMMENT '解析次数',
          status TINYINT DEFAULT 1 COMMENT '状态',
          remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
          INDEX idx_openid (openid),
          INDEX idx_phone (phone),
          INDEX idx_created_at (created_at),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
      `)
      
      console.log('✅ users 表创建成功！')
    } else {
      console.log('✅ users 表已存在，检查字段...')
      
      // 2. 查看表结构
      const [columns] = await connection.query("DESCRIBE users")
      const columnNames = columns.map(col => col.Field)
      
      console.log(`📋 当前字段: ${columnNames.join(', ')}\n`)
      
      // 3. 检查并添加缺失的字段
      const requiredFields = [
        { name: 'last_login_time', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "最后登录时间"' },
        { name: 'login_count', type: 'INT DEFAULT 0 COMMENT "登录次数"' },
        { name: 'phone', type: 'VARCHAR(20) DEFAULT NULL COMMENT "手机号"' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT "注册时间"' }
      ]
      
      for (const field of requiredFields) {
        if (!columnNames.includes(field.name)) {
          console.log(`⚠️  缺少字段 ${field.name}，正在添加...`)
          try {
            await connection.query(`ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`)
            console.log(`✅ 添加字段 ${field.name} 成功`)
          } catch (err) {
            console.error(`❌ 添加字段 ${field.name} 失败:`, err.message)
          }
        } else {
          console.log(`✅ 字段 ${field.name} 已存在`)
        }
      }
    }
    
    console.log('\n🎉 用户表结构检查完成！\n')
    
    // 4. 显示最终的表结构
    const [finalColumns] = await connection.query("DESCRIBE users")
    console.log('📊 最终表结构：')
    console.table(finalColumns.map(col => ({
      字段: col.Field,
      类型: col.Type,
      允许空: col.Null,
      默认值: col.Default
    })))
    
  } catch (error) {
    console.error('\n❌ 操作失败:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示：无法连接数据库')
      console.log('   请检查：')
      console.log('   1. 数据库服务是否启动')
      console.log('   2. .env 文件中的数据库配置是否正确')
      console.log('   3. 网络连接是否正常\n')
    }
  } finally {
    if (connection) {
      connection.release()
    }
    process.exit(0)
  }
}

fixUsersTable()

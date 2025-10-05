// scripts/createUsersTable.js - 创建用户表脚本
const db = require('../config/database')

/**
 * 创建用户表
 */
async function createUsersTable() {
  try {
    console.log('📋 开始创建用户表...')
    
    // 创建用户表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
        openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
        unionid VARCHAR(100) DEFAULT NULL COMMENT '微信unionid',
        phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
        nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
        avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后登录时间',
        login_count INT DEFAULT 0 COMMENT '登录次数',
        status TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
        INDEX idx_openid (openid),
        INDEX idx_phone (phone),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
    `
    
    await db.query(createTableSQL)
    console.log('✅ 用户表创建成功')
    
    // 创建用户登录日志表（可选）
    const createLogTableSQL = `
      CREATE TABLE IF NOT EXISTS user_login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
        user_id INT NOT NULL COMMENT '用户ID',
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
        login_type ENUM('wechat', 'phone', 'guest') DEFAULT 'wechat' COMMENT '登录类型',
        ip_address VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
        device_info TEXT DEFAULT NULL COMMENT '设备信息',
        INDEX idx_user_id (user_id),
        INDEX idx_login_time (login_time),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';
    `
    
    await db.query(createLogTableSQL)
    console.log('✅ 用户登录日志表创建成功')
    
    console.log('🎉 数据库表创建完成！')
    
    // 显示表结构
    const [tables] = await db.query('SHOW TABLES')
    console.log('\n📊 当前数据库表:')
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`)
    })
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ 创建表失败:', error)
    process.exit(1)
  }
}

// 执行创建表
createUsersTable()

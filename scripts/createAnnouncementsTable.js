/**
 * 创建公告表脚本
 */

require('dotenv').config()
const db = require('../config/database')

async function createAnnouncementsTable() {
  let connection
  
  try {
    console.log('\n📋 开始创建公告表...\n')
    
    connection = await db.pool.getConnection()
    
    // 创建公告表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
        content TEXT NOT NULL COMMENT '公告内容',
        status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
        priority INT DEFAULT 0 COMMENT '优先级：数字越大优先级越高',
        start_time TIMESTAMP NULL DEFAULT NULL COMMENT '开始时间',
        end_time TIMESTAMP NULL DEFAULT NULL COMMENT '结束时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        created_by VARCHAR(100) DEFAULT NULL COMMENT '创建人',
        
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表'
    `)
    
    console.log('✅ 公告表创建成功\n')
    
    // 检查是否已有数据
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM announcements')
    
    if (rows[0].count === 0) {
      console.log('📝 插入默认公告...\n')
      
      // 插入默认公告
      await connection.query(`
        INSERT INTO announcements (content, status, priority) VALUES 
        ('🎉 欢迎使用视频解析小程序！支持抖音、快手、B站等多平台视频解析', 1, 10),
        ('📢 登录后即可使用全部功能，快来体验吧！', 1, 5)
      `)
      
      console.log('✅ 默认公告插入成功\n')
    } else {
      console.log(`ℹ️ 已有 ${rows[0].count} 条公告记录\n`)
    }
    
    // 显示当前公告
    const [announcements] = await connection.query('SELECT * FROM announcements ORDER BY priority DESC')
    
    console.log('📊 当前公告列表：')
    console.table(announcements.map(a => ({
      ID: a.id,
      内容: a.content.substring(0, 50) + (a.content.length > 50 ? '...' : ''),
      状态: a.status === 1 ? '启用' : '禁用',
      优先级: a.priority
    })))
    
    console.log('\n🎉 公告表设置完成！\n')
    
  } catch (error) {
    console.error('\n❌ 创建表失败:', error.message)
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('💡 提示：表已存在\n')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示：无法连接数据库')
      console.log('   请检查：')
      console.log('   1. 数据库服务是否启动')
      console.log('   2. .env 文件中的数据库配置是否正确\n')
    }
  } finally {
    if (connection) {
      connection.release()
    }
    process.exit(0)
  }
}

createAnnouncementsTable()

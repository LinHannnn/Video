const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'video_extract_db',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 数据库连接测试
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    // 创建API密钥表
    const createApiKeysTable = `
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT PRIMARY KEY AUTO_INCREMENT,
        key_name VARCHAR(100) NOT NULL COMMENT '密钥名称',
        key_value VARCHAR(255) NOT NULL COMMENT '密钥值',
        status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
        description TEXT NULL COMMENT '密钥描述',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        UNIQUE KEY uk_key_name (key_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API密钥管理表';
    `;

    await pool.execute(createApiKeysTable);
    console.log('数据库表初始化完成');
    
    return true;
  } catch (error) {
    console.error('数据库表初始化失败:', error);
    return false;
  }
}

// 执行查询
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

// 执行事务
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  initDatabase
}; 
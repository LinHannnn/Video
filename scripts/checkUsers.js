/**
 * 查看用户记录脚本
 * 用于验证用户信息自动记录功能
 */

require('dotenv').config()
const db = require('../config/database')

async function checkUsers() {
  let connection
  
  try {
    console.log('\n📊 ========== 用户数据统计 ==========\n')
    
    // 获取数据库连接
    connection = await db.pool.getConnection()
    
    // 1. 总用户数
    const [total] = await connection.query('SELECT COUNT(*) as count FROM users')
    console.log(`✅ 总用户数: ${total[0].count}`)
    
    if (total[0].count === 0) {
      console.log('\n⚠️  暂无用户记录')
      console.log('💡 提示：请在小程序中登录一次，系统会自动创建用户记录\n')
      process.exit(0)
    }
    
    // 2. 今日新增用户
    const [todayNew] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at) = CURDATE()
    `)
    console.log(`✅ 今日新增: ${todayNew[0].count}`)
    
    // 3. 今日活跃用户
    const [todayActive] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(last_login_time) = CURDATE()
    `)
    console.log(`✅ 今日活跃: ${todayActive[0].count}`)
    
    // 4. 绑定手机号的用户数
    const [phoneUsers] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE phone IS NOT NULL
    `)
    console.log(`✅ 绑定手机号: ${phoneUsers[0].count}`)
    
    console.log('\n📋 ========== 最近登录的5个用户 ==========\n')
    
    // 5. 最近登录的用户列表
    const [recentUsers] = await connection.query(`
      SELECT 
        id,
        LEFT(openid, 12) as openid_short,
        CASE 
          WHEN phone IS NOT NULL THEN CONCAT(LEFT(phone, 3), '****', RIGHT(phone, 4))
          ELSE '未绑定'
        END as phone_masked,
        login_count,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as register_time,
        DATE_FORMAT(last_login_time, '%Y-%m-%d %H:%i') as last_login
      FROM users
      ORDER BY last_login_time DESC
      LIMIT 5
    `)
    
    if (recentUsers.length > 0) {
      console.table(recentUsers)
    }
    
    console.log('\n📈 ========== 用户活跃度分析 ==========\n')
    
    // 6. 登录频率分布
    const [loginFreq] = await connection.query(`
      SELECT 
        CASE 
          WHEN login_count = 1 THEN '1次 (新用户)'
          WHEN login_count BETWEEN 2 AND 5 THEN '2-5次'
          WHEN login_count BETWEEN 6 AND 10 THEN '6-10次'
          WHEN login_count BETWEEN 11 AND 20 THEN '11-20次'
          ELSE '20次以上 (活跃用户)'
        END as login_frequency,
        COUNT(*) as user_count
      FROM users
      GROUP BY 
        CASE 
          WHEN login_count = 1 THEN '1次 (新用户)'
          WHEN login_count BETWEEN 2 AND 5 THEN '2-5次'
          WHEN login_count BETWEEN 6 AND 10 THEN '6-10次'
          WHEN login_count BETWEEN 11 AND 20 THEN '11-20次'
          ELSE '20次以上 (活跃用户)'
        END
      ORDER BY MIN(login_count)
    `)
    
    console.table(loginFreq)
    
    console.log('\n💡 ========== 使用建议 ==========\n')
    console.log('1. 定期运行此脚本查看用户数据')
    console.log('2. 每次用户登录都会自动更新记录')
    console.log('3. login_count 记录了用户的登录次数')
    console.log('4. last_login_time 记录了最后登录时间')
    console.log('5. 可以基于这些数据分析用户活跃度\n')
    
  } catch (error) {
    console.error('\n❌ 查询失败:', error.message)
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 提示：users 表不存在，请先运行以下命令创建：')
      console.log('   node scripts/createUsersTable.js\n')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示：无法连接数据库，请检查：')
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

checkUsers()

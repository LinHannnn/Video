// 公告管理脚本
const db = require('../config/database')

async function manageAnnouncements() {
  try {
    console.log('📢 开始管理公告...')
    
    // 查询所有公告
    const allAnnouncements = await db.query(`
      SELECT id, content, status, priority
      FROM announcements
      ORDER BY priority DESC, created_at DESC
    `)
    
    console.log(`当前共有 ${allAnnouncements.length} 条公告：`)
    allAnnouncements.forEach((ann, index) => {
      console.log(`${index + 1}. [ID:${ann.id}] ${ann.content} (状态: ${ann.status === 1 ? '启用' : '禁用'})`)
    })
    
    // 只保留第一条，禁用其他所有公告
    if (allAnnouncements.length > 1) {
      const keepId = allAnnouncements[0].id
      
      await db.query(`
        UPDATE announcements 
        SET status = 0 
        WHERE id != ?
      `, [keepId])
      
      console.log(`\n✅ 已禁用除 ID=${keepId} 外的所有公告`)
    }
    
    // 确保第一条是启用状态
    if (allAnnouncements.length > 0) {
      await db.query(`
        UPDATE announcements 
        SET status = 1 
        WHERE id = ?
      `, [allAnnouncements[0].id])
      
      console.log(`✅ 已确保公告 "${allAnnouncements[0].content}" 为启用状态`)
    }
    
    // 查看最终结果
    const activeAnnouncements = await db.query(`
      SELECT id, content, status
      FROM announcements
      WHERE status = 1
      ORDER BY priority DESC, created_at DESC
    `)
    
    console.log(`\n最终启用的公告数量: ${activeAnnouncements.length}`)
    activeAnnouncements.forEach((ann) => {
      console.log(`- ${ann.content}`)
    })
    
  } catch (error) {
    console.error('❌ 管理公告失败:', error)
  } finally {
    process.exit(0)
  }
}

manageAnnouncements()

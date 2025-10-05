// controllers/announcementController.js - 公告管理控制器

const db = require('../config/database')

/**
 * 获取当前有效的公告列表
 * 用于小程序首页显示
 */
exports.getActiveAnnouncements = async (req, res) => {
  try {
    console.log('📢 获取有效公告列表')
    
    const now = new Date()
    
    // 查询有效的公告
    const announcements = await db.query(`
      SELECT id, content, priority, start_time, end_time
      FROM announcements
      WHERE status = 1
        AND (start_time IS NULL OR start_time <= ?)
        AND (end_time IS NULL OR end_time >= ?)
      ORDER BY priority DESC, created_at DESC
    `, [now, now])
    
    console.log(`✅ 查询到 ${announcements.length} 条有效公告`)
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: announcements
    })
  } catch (error) {
    console.error('❌ 获取公告失败:', error)
    res.status(500).json({
      code: 500,
      msg: '获取公告失败',
      error: error.message
    })
  }
}

/**
 * 获取所有公告列表（管理端）
 */
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const offset = (page - 1) * limit
    
    let whereClause = ''
    let params = []
    
    if (status !== undefined) {
      whereClause = 'WHERE status = ?'
      params.push(status)
    }
    
    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM announcements ${whereClause}`,
      params
    )
    const total = countResult.total
    
    // 查询列表
    const announcements = await db.query(
      `SELECT * FROM announcements ${whereClause} 
       ORDER BY priority DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    )
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: announcements,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('❌ 获取公告列表失败:', error)
    res.status(500).json({
      code: 500,
      msg: '获取公告列表失败',
      error: error.message
    })
  }
}

/**
 * 创建新公告
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const { content, status = 1, priority = 0, start_time, end_time, created_by } = req.body
    
    if (!content) {
      return res.status(400).json({
        code: 400,
        msg: '公告内容不能为空'
      })
    }
    
    const result = await db.query(
      `INSERT INTO announcements (content, status, priority, start_time, end_time, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [content, status, priority, start_time || null, end_time || null, created_by || null]
    )
    
    console.log('✅ 创建公告成功, ID:', result.insertId)
    
    res.json({
      code: 200,
      msg: '创建成功',
      data: {
        id: result.insertId
      }
    })
  } catch (error) {
    console.error('❌ 创建公告失败:', error)
    res.status(500).json({
      code: 500,
      msg: '创建公告失败',
      error: error.message
    })
  }
}

/**
 * 更新公告
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const { content, status, priority, start_time, end_time } = req.body
    
    // 检查公告是否存在
    const announcements = await db.query('SELECT id FROM announcements WHERE id = ?', [id])
    
    if (announcements.length === 0) {
      return res.status(404).json({
        code: 404,
        msg: '公告不存在'
      })
    }
    
    // 构建更新语句
    const updates = []
    const params = []
    
    if (content !== undefined) {
      updates.push('content = ?')
      params.push(content)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?')
      params.push(start_time || null)
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?')
      params.push(end_time || null)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '没有要更新的内容'
      })
    }
    
    params.push(id)
    
    await db.query(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    
    console.log('✅ 更新公告成功, ID:', id)
    
    res.json({
      code: 200,
      msg: '更新成功'
    })
  } catch (error) {
    console.error('❌ 更新公告失败:', error)
    res.status(500).json({
      code: 500,
      msg: '更新公告失败',
      error: error.message
    })
  }
}

/**
 * 删除公告
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await db.query('DELETE FROM announcements WHERE id = ?', [id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        msg: '公告不存在'
      })
    }
    
    console.log('✅ 删除公告成功, ID:', id)
    
    res.json({
      code: 200,
      msg: '删除成功'
    })
  } catch (error) {
    console.error('❌ 删除公告失败:', error)
    res.status(500).json({
      code: 500,
      msg: '删除公告失败',
      error: error.message
    })
  }
}

/**
 * 批量更新公告状态
 */
exports.batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        msg: 'ids 必须是非空数组'
      })
    }
    
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        code: 400,
        msg: 'status 必须是 0 或 1'
      })
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const result = await db.query(
      `UPDATE announcements SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    )
    
    console.log(`✅ 批量更新公告状态成功, 影响 ${result.affectedRows} 条记录`)
    
    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        affectedRows: result.affectedRows
      }
    })
  } catch (error) {
    console.error('❌ 批量更新公告状态失败:', error)
    res.status(500).json({
      code: 500,
      msg: '批量更新失败',
      error: error.message
    })
  }
}

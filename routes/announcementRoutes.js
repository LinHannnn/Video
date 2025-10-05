// routes/announcementRoutes.js - 公告路由

const express = require('express')
const router = express.Router()
const announcementController = require('../controllers/announcementController')

// 公开接口 - 获取有效公告（用于小程序）
router.get('/active', announcementController.getActiveAnnouncements)

// 管理接口 - 获取所有公告
router.get('/', announcementController.getAllAnnouncements)

// 管理接口 - 创建公告
router.post('/', announcementController.createAnnouncement)

// 管理接口 - 更新公告
router.put('/:id', announcementController.updateAnnouncement)

// 管理接口 - 删除公告
router.delete('/:id', announcementController.deleteAnnouncement)

// 管理接口 - 批量更新状态
router.post('/batch/status', announcementController.batchUpdateStatus)

module.exports = router

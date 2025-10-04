const express = require('express');
const router = express.Router();
const keyController = require('../controllers/keyController');

/**
 * API密钥管理相关路由
 */

// GET /api/admin/keys - 获取密钥列表
router.get('/', keyController.getKeys);

// GET /api/admin/keys/:keyId - 获取密钥详情
router.get('/:keyId', keyController.getKeyById);

// POST /api/admin/keys - 添加新密钥
router.post('/', keyController.createKey);

// PUT /api/admin/keys/:keyId - 更新密钥
router.put('/:keyId', keyController.updateKey);

// DELETE /api/admin/keys/:keyId - 删除密钥
router.delete('/:keyId', keyController.deleteKey);

// POST /api/admin/keys/batch/status - 批量更新密钥状态
router.post('/batch/status', keyController.batchUpdateStatus);

module.exports = router; 
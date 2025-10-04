const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

/**
 * 视频解析相关路由
 */

// POST /api/video/parse - 解析视频
router.post('/parse', videoController.parseVideo);

// GET /api/video/platforms - 获取支持的平台列表
router.get('/platforms', videoController.getSupportedPlatforms);

// GET /api/video/health - 健康检查
router.get('/health', videoController.healthCheck);

module.exports = router; 
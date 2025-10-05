// routes/authRoutes.js - 认证相关路由
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

/**
 * @route   POST /auth/login
 * @desc    微信登录（支持手机号快速验证）
 * @access  Public
 * @body    { loginCode: string, phoneCode?: string }
 */
router.post('/login', authController.login)

/**
 * @route   GET /auth/userinfo
 * @desc    获取当前登录用户信息
 * @access  Private (需要 token)
 */
router.get('/userinfo', authMiddleware, authController.getUserInfo)

/**
 * @route   POST /auth/refresh
 * @desc    刷新 token
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post('/refresh', authController.refreshToken)

/**
 * @route   POST /auth/logout
 * @desc    退出登录
 * @access  Private (需要 token)
 */
router.post('/logout', authMiddleware, authController.logout)

module.exports = router
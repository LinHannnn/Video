const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// 微信登录
router.post('/login', authController.wxLogin)

// 获取用户信息
router.get('/userinfo', authController.getUserInfo)

// 刷新token
router.post('/refresh', authController.refreshToken)

module.exports = router
// pages/profile/profile.js
const util = require('../../utils/util.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    showDisclaimer: false,
    showAbout: false
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const isLoggedIn = auth.checkLoginStatus()
    
    this.setData({
      isLoggedIn,
      userInfo: app.globalData.userInfo || {}
    })
  },

  // 微信登录
  async onLogin() {
    try {
      util.showLoading('登录中...')
      
      // 先获取微信登录凭证
      await auth.wxLogin()
      
      // 获取用户信息
      const userInfo = await auth.getUserInfo()
      
      this.setData({
        isLoggedIn: true,
        userInfo
      })
      
      util.showToast('登录成功', 'success')
    } catch (error) {
      console.error('登录失败:', error)
      
      if (error.errMsg && error.errMsg.includes('deny')) {
        util.showToast('用户拒绝授权')
      } else {
        util.showToast('登录失败，请重试')
      }
    } finally {
      util.hideLoading()
    }
  },

  // 游客模式登录
  async onGuestLogin() {
    try {
      const userInfo = await auth.guestLogin()
      
      this.setData({
        isLoggedIn: true,
        userInfo
      })
      
      util.showToast('已进入游客模式', 'success')
    } catch (error) {
      console.error('游客登录失败:', error)
      util.showToast('登录失败，请重试')
    }
  },

  // 退出登录
  async onLogout() {
    const confirm = await util.showModal('确认退出', '确定要退出登录吗？')
    if (confirm) {
      auth.logout()
      
      this.setData({
        isLoggedIn: false,
        userInfo: {}
      })
      
      util.showToast('已退出登录', 'success')
    }
  },

  // 显示免责声明
  onShowDisclaimer() {
    this.setData({
      showDisclaimer: true
    })
  },

  // 关闭免责声明
  onCloseDisclaimer() {
    this.setData({
      showDisclaimer: false
    })
  },

  // 联系客服
  onContactService() {
    wx.navigateTo({
      url: '/pages/service/service'
    })
  },

  // 关于我们
  onAbout() {
    this.setData({
      showAbout: true
    })
  },

  // 关闭关于我们
  onCloseAbout() {
    this.setData({
      showAbout: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击模态框内容时关闭弹窗
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '视频提取助手 - 免费视频下载工具',
      path: '/pages/home/home',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '视频提取助手 - 免费视频下载工具',
      imageUrl: '/images/share-cover.png'
    }
  }
}) 
// pages/home/home.js
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    inputUrl: '',
    isLoading: false,
    showDisclaimer: false,
    showLoginModal: false,
    videoInfo: null,
    loginCode: '', // 保存登录 code
    announcements: [] // 公告列表
  },

  onLoad() {
    // 初始化剪贴板提示的锁与上次内容，避免重复弹窗
    this._clipboardPromptLock = false
    this._lastClipboardText = ''
    // 加载公告
    this.loadAnnouncements()
  },

  onShow() {
    // 页面显示时重新检查剪贴板
    this.checkClipboard()
  },

  // 检查剪贴板内容
  async checkClipboard() {
    // 防重入：避免 onLoad 与 onShow 或快速多次触发导致弹窗出现两次
    if (this._clipboardPromptLock) return
    this._clipboardPromptLock = true
    try {
      const clipboardData = await util.getClipboardData()
      // 与上次处理过的内容相同则不再提示
      if (clipboardData === this._lastClipboardText) {
        this._clipboardPromptLock = false
        return
      }

      if (clipboardData && util.isValidUrl(clipboardData) && clipboardData !== this.data.inputUrl) {
        const shouldPaste = await util.showModal('发现剪贴板链接', '是否粘贴剪贴板中的链接？')
        // 记录本次提示内容，避免再次进入页面时重复弹窗
        this._lastClipboardText = clipboardData
        if (shouldPaste) {
          this.setData({
            inputUrl: clipboardData
          })
        }
      }
    } catch (error) {
      console.log('读取剪贴板失败:', error)
    } finally {
      this._clipboardPromptLock = false
    }
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      inputUrl: e.detail.value
    })
  },

  // 清空按钮点击
  onClear() {
    this.setData({
      inputUrl: '',
      videoInfo: null
    })
    util.showToast('已清空', 'success')
  },

  // 粘贴并解析按钮点击
  async onPasteAndParse() {
    let url = this.data.inputUrl.trim()
    
    // 如果输入框为空，先尝试从剪贴板获取
    if (!url) {
      try {
        const clipboardData = await util.getClipboardData()
        if (clipboardData && util.isValidUrl(clipboardData)) {
          url = clipboardData
          this.setData({
            inputUrl: url
          })
        } else {
          util.showToast('剪贴板中没有有效链接')
          return
        }
      } catch (error) {
        util.showToast('请先输入或粘贴视频链接')
        return
      }
    }

    if (!util.isValidUrl(url)) {
      util.showToast('请输入有效的链接地址')
      return
    }

    // 🔐 检查登录状态
    if (!auth.isLoggedIn()) {
      console.log('❌ 用户未登录，显示登录弹窗')
      // 显示登录弹窗
      this.setData({
        showLoginModal: true
      })
      return
    }

    // 已登录，继续显示免责声明
    this.setData({
      showDisclaimer: true
    })
  },

  // 关闭免责声明弹窗
  onCloseDisclaimer() {
    this.setData({
      showDisclaimer: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击模态框内容时关闭弹窗
  },

  // ============ 登录相关方法 ============

  // 关闭登录弹窗
  onCloseLoginModal() {
    this.setData({
      showLoginModal: false,
      loginCode: ''
    })
  },

  // 用户点击"立即登录"按钮，不获取手机号的简单登录
  async onSimpleLogin() {
    try {
      util.showLoading('正在登录...')
      
      // 执行登录
      const result = await auth.login()
      
      if (result.success) {
        util.showToast('登录成功', 'success')
        
        // 关闭登录弹窗
        this.setData({
          showLoginModal: false
        })
        
        // 继续显示免责声明
        this.setData({
          showDisclaimer: true
        })
      } else {
        util.showToast(result.error || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      util.showToast(error.message || '登录失败')
    } finally {
      util.hideLoading()
    }
  },

  // 获取手机号授权（通过 button 组件触发）
  async onGetPhoneNumber(e) {
    console.log('📱 手机号授权回调:', e.detail)
    
    if (e.detail.code) {
      try {
        util.showLoading('正在获取手机号...')
        
        // 使用手机号 code 进行登录
        const phoneCode = e.detail.code
        const result = await auth.login(phoneCode)
        
        if (result.success) {
          util.showToast('登录成功', 'success')
          
          // 关闭登录弹窗
          this.setData({
            showLoginModal: false
          })
          
          // 继续显示免责声明
          this.setData({
            showDisclaimer: true
          })
        } else {
          util.showToast(result.error || '登录失败')
        }
      } catch (error) {
        console.error('获取手机号失败:', error)
        util.showToast(error.message || '获取手机号失败')
      } finally {
        util.hideLoading()
      }
    } else {
      // 用户拒绝授权
      console.log('用户取消手机号授权')
      util.showToast('您取消了授权')
    }
  },

  // 确认并继续提取
  async onConfirmExtract() {
    this.setData({
      showDisclaimer: false,
      isLoading: true,
      videoInfo: null
    })

    try {
      util.showLoading('正在解析视频...')
      
      const result = await api.parseVideo(this.data.inputUrl.trim())
      
      if (result.code === 200 && result.data) {
        this.setData({
          videoInfo: result.data
        })
        util.showToast('解析成功', 'success')
        
        // 跳转到视频详情页面
        this.navigateToVideoDetail(result.data)
      } else {
        throw new Error(result.msg || '解析失败')
      }
    } catch (error) {
      console.error('视频解析失败:', error)
      util.showToast(error.message || '解析失败，请检查链接是否正确')
    } finally {
      util.hideLoading()
      this.setData({
        isLoading: false
      })
    }
  },

  // 跳转到视频详情页面
  navigateToVideoDetail(videoInfo) {
    // 将视频信息保存到全局数据中
    const app = getApp()
    app.globalData.currentVideoInfo = videoInfo
    
    // 跳转到视频详情页面
    wx.navigateTo({
      url: '/pages/video-detail/video-detail',
      fail: (error) => {
        console.error('页面跳转失败:', error)
        util.showToast('页面跳转失败')
      }
    })
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
  },

  // 加载公告
  async loadAnnouncements() {
    try {
      const result = await api.getAnnouncements()
      if (result.code === 200 && result.data) {
        this.setData({
          announcements: result.data
        })
        console.log('✅ 加载公告成功', result.data.length, '条')
      }
    } catch (error) {
      console.error('❌ 加载公告失败:', error)
      // 加载公告失败不影响主要功能，静默处理
    }
  }
})
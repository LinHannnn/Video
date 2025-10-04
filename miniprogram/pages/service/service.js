// pages/service/service.js
const util = require('../../utils/util.js')

Page({
  data: {
    wechatId: 'video_helper_2024', // 客服微信号
    qrcodeLoaded: true,
    feedbackText: '',
    faqList: [
      {
        id: 1,
        question: '支持哪些平台的视频解析？',
        answer: '目前支持抖音、快手、小红书、微博等主流短视频平台，我们会持续增加更多平台支持。',
        expanded: false
      },
      {
        id: 2,
        question: '解析失败怎么办？',
        answer: '请检查链接是否正确，确保是完整的视频分享链接。如果仍然失败，可能是该平台暂不支持或视频已被删除。',
        expanded: false
      },
      {
        id: 3,
        question: '下载的视频在哪里？',
        answer: '我们只提供视频解析服务，不提供直接下载。您需要复制解析出的链接，使用浏览器或下载工具进行下载。',
        expanded: false
      },
      {
        id: 4,
        question: '是否收费？',
        answer: '本小程序完全免费使用，无任何隐藏收费。我们承诺永久免费为用户提供服务。',
        expanded: false
      },
      {
        id: 5,
        question: '如何联系客服？',
        answer: '您可以扫描上方二维码添加客服微信，或者通过下方的意见反馈功能向我们反馈问题。',
        expanded: false
      }
    ]
  },

  onLoad() {
    // 页面加载
    wx.setNavigationBarTitle({
      title: '联系客服'
    })
  },

  // 二维码加载错误
  onQrcodeError() {
    this.setData({
      qrcodeLoaded: false
    })
  },

  // 复制微信号
  async onCopy(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return

    try {
      await util.copyToClipboard(text)
    } catch (error) {
      util.showToast('复制失败')
      console.error('复制失败:', error)
    }
  },

  // 切换FAQ展开状态
  onToggleFaq(e) {
    const index = e.currentTarget.dataset.index
    const faqList = [...this.data.faqList]
    faqList[index].expanded = !faqList[index].expanded
    
    this.setData({
      faqList
    })
  },

  // 反馈输入
  onFeedbackInput(e) {
    this.setData({
      feedbackText: e.detail.value
    })
  },

  // 提交反馈
  async onSubmitFeedback() {
    const feedback = this.data.feedbackText.trim()
    if (!feedback) {
      util.showToast('请输入反馈内容')
      return
    }

    try {
      util.showLoading('提交中...')
      
      // 这里可以调用后端API提交反馈
      // 暂时使用本地存储模拟
      const feedbacks = wx.getStorageSync('feedbacks') || []
      feedbacks.push({
        content: feedback,
        time: new Date().toISOString(),
        id: Date.now()
      })
      wx.setStorageSync('feedbacks', feedbacks)
      
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      util.showToast('提交成功，感谢您的反馈', 'success')
      
      this.setData({
        feedbackText: ''
      })
    } catch (error) {
      console.error('提交反馈失败:', error)
      util.showToast('提交失败，请重试')
    } finally {
      util.hideLoading()
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '视频提取助手 - 遇到问题？联系客服',
      path: '/pages/service/service',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '视频提取助手客服页面',
      imageUrl: '/images/share-cover.png'
    }
  }
}) 
// pages/video-detail/video-detail.js
const util = require('../../utils/util.js')

Page({
  data: {
    videoInfo: null,
    showVideoPlayer: false
  },

  onLoad(options) {
    // 从页面参数或全局数据中获取视频信息
    const app = getApp()
    if (options.videoData) {
      try {
        const videoInfo = JSON.parse(decodeURIComponent(options.videoData))
        this.setData({
          videoInfo: videoInfo
        })
      } catch (error) {
        console.error('解析视频数据失败:', error)
        this.goBack()
      }
    } else if (app.globalData.currentVideoInfo) {
      this.setData({
        videoInfo: app.globalData.currentVideoInfo
      })
    } else {
      util.showToast('视频信息不存在')
      this.goBack()
    }
  },

  onReady() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '视频解析结果'
    })
  },

  // 播放视频
  onPlayVideo() {
    if (this.data.videoInfo && this.data.videoInfo.videoUrl) {
      this.setData({
        showVideoPlayer: true
      })
    } else {
      util.showToast('视频链接不存在')
    }
  },

  // 关闭视频播放器
  onClosePlayer() {
    this.setData({
      showVideoPlayer: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击模态框内容时关闭弹窗
  },

  // 下载视频
  async onDownload() {
    const videoInfo = this.data.videoInfo
    if (!videoInfo || !videoInfo.videoUrl) {
      util.showToast('视频链接不存在')
      return
    }

    try {
      util.showLoading('准备下载...')
      
      // 构建下载代理链接
      const api = require('../../utils/api.js')
      const config = api.getConfig ? api.getConfig() : { baseUrl: 'https://jzhtreabislo.sealosbja.site/api' }
      const title = videoInfo.title || videoInfo.work_title || '视频'
      const downloadUrl = `${config.baseUrl}/video/download?url=${encodeURIComponent(videoInfo.videoUrl)}&title=${encodeURIComponent(title)}`
      
      // 复制下载链接到剪贴板
      await util.copyToClipboard(downloadUrl)
      util.hideLoading()
      
      // 提示用户
      wx.showModal({
        title: '下载提示',
        content: '视频下载链接已复制到剪贴板，请在浏览器中打开链接',
        showCancel: false,
        confirmText: '知道了'
      })
    } catch (error) {
      util.hideLoading()
      console.error('下载失败:', error)
      util.showToast('下载失败，请稍后重试')
    }
  },

  // 复制视频链接
  async onCopyVideoUrl() {
    const videoInfo = this.data.videoInfo
    if (!videoInfo || !videoInfo.videoUrl) {
      util.showToast('视频链接不存在')
      return
    }

    try {
      await util.copyToClipboard(videoInfo.videoUrl)
    } catch (error) {
      util.showToast('复制失败')
      console.error('复制失败:', error)
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果返回失败，跳转到首页
        wx.reLaunch({
          url: '/pages/home/home'
        })
      }
    })
  },

  // 分享功能
  onShareAppMessage() {
    const videoInfo = this.data.videoInfo
    const title = videoInfo ? (videoInfo.title || videoInfo.work_title) : '视频提取助手'
    const coverUrl = videoInfo ? (videoInfo.coverImage || videoInfo.coverUrl) : null
    return {
      title: title,
      path: '/pages/home/home',
      imageUrl: coverUrl || '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const videoInfo = this.data.videoInfo
    const title = videoInfo ? (videoInfo.title || videoInfo.work_title) : '视频提取助手'
    const coverUrl = videoInfo ? (videoInfo.coverImage || videoInfo.coverUrl) : null
    return {
      title: title,
      imageUrl: coverUrl || '/images/share-cover.png'
    }
  }
}) 
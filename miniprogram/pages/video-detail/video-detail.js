// pages/video-detail/video-detail.js
const util = require('../../utils/util.js')

Page({
  data: {
    videoInfo: null,
    showVideoPlayer: false,
    isDownloading: false,
    downloadProgress: 0
  },

  onLoad(options) {
    // 从页面参数或全局数据中获取视频信息
    const app = getApp()
    let videoInfo = null
    
    if (options.videoData) {
      try {
        videoInfo = JSON.parse(decodeURIComponent(options.videoData))
      } catch (error) {
        console.error('解析视频数据失败:', error)
        this.goBack()
        return
      }
    } else if (app.globalData.currentVideoInfo) {
      videoInfo = app.globalData.currentVideoInfo
    } else {
      util.showToast('视频信息不存在')
      this.goBack()
      return
    }

    // 格式化视频大小
    if (videoInfo) {
      videoInfo = this.formatVideoSize(videoInfo)
      this.setData({
        videoInfo: videoInfo
      })
    }
  },

  // 格式化视频大小
  formatVideoSize(videoInfo) {
    if (!videoInfo.size) {
      return videoInfo
    }

    let size = videoInfo.size
    
    // 如果已经是格式化的字符串，直接返回
    if (typeof size === 'string' && size.includes('MB')) {
      return videoInfo
    }

    // 如果是数字（字节），转换为MB
    if (typeof size === 'number') {
      const sizeInMB = (size / (1024 * 1024)).toFixed(2)
      videoInfo.size = `${sizeInMB}MB`
    }

    return videoInfo
  },

  onReady() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '视频解析结果'
    })
    
    // 如果没有视频大小，尝试获取
    if (this.data.videoInfo && !this.data.videoInfo.size && this.data.videoInfo.videoUrl) {
      this.fetchVideoSize()
    }
  },

  // 获取视频文件大小
  async fetchVideoSize() {
    try {
      const videoInfo = this.data.videoInfo
      if (!videoInfo || !videoInfo.videoUrl) {
        return
      }

      console.log('🔍 尝试获取视频文件大小...')

      // 使用 HEAD 请求获取文件大小（不下载文件内容）
      wx.request({
        url: videoInfo.videoUrl,
        method: 'HEAD',
        success: (res) => {
          const contentLength = res.header['Content-Length'] || res.header['content-length']
          
          if (contentLength) {
            const sizeInBytes = parseInt(contentLength)
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
            
            console.log(`✅ 获取到视频大小: ${sizeInMB}MB (${sizeInBytes} bytes)`)
            
            // 更新视频信息
            const updatedVideoInfo = {
              ...this.data.videoInfo,
              size: `${sizeInMB}MB`
            }
            
            this.setData({
              videoInfo: updatedVideoInfo
            })
            
            // 同时更新全局数据
            const app = getApp()
            app.globalData.currentVideoInfo = updatedVideoInfo
          } else {
            console.log('⚠️ 无法获取视频大小：响应头中没有 Content-Length')
          }
        },
        fail: (error) => {
          console.log('⚠️ 获取视频大小失败:', error)
          // 失败不影响其他功能，静默处理
        }
      })
    } catch (error) {
      console.error('❌ 获取视频大小出错:', error)
    }
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

    // 防止重复下载
    if (this.data.isDownloading) {
      util.showToast('视频正在下载中...')
      return
    }

    try {
      // 1. 请求保存到相册的权限
      const authorized = await this.requestSaveToPhotosAlbumAuth()
      if (!authorized) {
        return
      }

      // 2. 开始下载
      this.setData({
        isDownloading: true,
        downloadProgress: 0
      })

      wx.showLoading({
        title: '准备下载...',
        mask: true
      })

      // 3. 构建代理下载链接（通过后端服务器下载，避免域名限制）
      const api = require('../../utils/api.js')
      const config = api.getConfig ? api.getConfig() : { baseUrl: 'https://lhbxbuktfrop.sealoshzh.site/api' }
      const title = videoInfo.title || videoInfo.work_title || '视频'
      
      // 使用后端的下载代理接口
      const proxyDownloadUrl = `${config.baseUrl}/video/download?url=${encodeURIComponent(videoInfo.videoUrl)}&title=${encodeURIComponent(title)}`
      
      console.log('📥 开始下载视频（通过代理）:', proxyDownloadUrl)

      // 4. 使用 downloadFile 下载视频（通过代理）
      const downloadTask = wx.downloadFile({
        url: proxyDownloadUrl,
        success: async (res) => {
          wx.hideLoading()
          
          if (res.statusCode === 200) {
            console.log('✅ 视频下载成功，临时文件路径:', res.tempFilePath)
            
            // 4. 保存到相册
            try {
              wx.showLoading({
                title: '正在保存...',
                mask: true
              })

              await this.saveVideoToPhotosAlbum(res.tempFilePath)
              
              wx.hideLoading()
              
              // 5. 下载成功提示
              wx.showModal({
                title: '下载成功',
                content: '视频已保存到手机相册',
                showCancel: false,
                confirmText: '好的',
                success: () => {
                  this.setData({
                    isDownloading: false,
                    downloadProgress: 0
                  })
                }
              })
            } catch (saveError) {
              wx.hideLoading()
              console.error('❌ 保存到相册失败:', saveError)
              
              this.setData({
                isDownloading: false,
                downloadProgress: 0
              })
              
              if (saveError.errMsg && saveError.errMsg.includes('auth deny')) {
                util.showToast('保存失败：权限被拒绝')
              } else {
                util.showToast('保存到相册失败')
              }
            }
          } else {
            console.error('❌ 下载失败，状态码:', res.statusCode)
            this.setData({
              isDownloading: false,
              downloadProgress: 0
            })
            util.showToast('下载失败，请稍后重试')
          }
        },
        fail: (error) => {
          wx.hideLoading()
          console.error('❌ 下载失败:', error)
          
          this.setData({
            isDownloading: false,
            downloadProgress: 0
          })
          
          util.showToast('下载失败，请检查网络')
        }
      })

      // 6. 监听下载进度
      downloadTask.onProgressUpdate((progress) => {
        const percent = progress.progress
        console.log('📊 下载进度:', percent + '%')
        
        this.setData({
          downloadProgress: percent
        })
        
        wx.showLoading({
          title: `下载中 ${percent}%`,
          mask: true
        })
      })

    } catch (error) {
      wx.hideLoading()
      console.error('❌ 下载过程出错:', error)
      
      this.setData({
        isDownloading: false,
        downloadProgress: 0
      })
      
      util.showToast('下载失败，请稍后重试')
    }
  },

  // 请求保存到相册的权限
  async requestSaveToPhotosAlbumAuth() {
    return new Promise((resolve) => {
      // 检查是否已授权
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum']) {
            // 已授权
            console.log('✅ 已获得相册权限')
            resolve(true)
          } else if (res.authSetting['scope.writePhotosAlbum'] === false) {
            // 用户曾经拒绝过，需要引导用户打开设置
            wx.showModal({
              title: '需要相册权限',
              content: '保存视频需要相册权限。请点击右上角"..."，选择"设置"，然后开启"保存到相册"权限。',
              showCancel: true,
              cancelText: '取消',
              confirmText: '知道了',
              success: (modalRes) => {
                // 不再自动打开设置，避免小程序重启
                // 用户可以手动去设置
                resolve(false)
              }
            })
          } else {
            // 第一次请求权限
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success: () => {
                console.log('✅ 用户同意授权')
                resolve(true)
              },
              fail: () => {
                console.log('❌ 用户拒绝授权')
                util.showToast('需要相册权限才能保存视频')
                resolve(false)
              }
            })
          }
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  // 保存视频到相册
  saveVideoToPhotosAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveVideoToPhotosAlbum({
        filePath: filePath,
        success: (res) => {
          console.log('✅ 视频已保存到相册')
          resolve(res)
        },
        fail: (error) => {
          console.error('❌ 保存视频到相册失败:', error)
          reject(error)
        }
      })
    })
  },

  // 复制视频下载链接
  async onCopyVideoUrl() {
    const videoInfo = this.data.videoInfo
    if (!videoInfo || !videoInfo.videoUrl) {
      util.showToast('视频链接不存在')
      return
    }

    try {
      // 构建下载代理链接
      const api = require('../../utils/api.js')
      const config = api.getConfig ? api.getConfig() : { baseUrl: 'https://lhbxbuktfrop.sealoshzh.site/api' }
      const title = videoInfo.title || videoInfo.work_title || '视频'
      
      // 使用后端的下载代理接口
      const downloadUrl = `${config.baseUrl}/video/download?url=${encodeURIComponent(videoInfo.videoUrl)}&title=${encodeURIComponent(title)}`
      
      // 复制下载代理链接
      await util.copyToClipboard(downloadUrl)
      
      // 显示提示信息
      wx.showModal({
        title: '复制成功',
        content: '下载链接已复制到剪贴板，请粘贴至浏览器进行下载',
        showCancel: false,
        confirmText: '知道了'
      })
      
      console.log('✅ 视频下载链接已复制:', downloadUrl)
    } catch (error) {
      util.showToast('复制失败')
      console.error('❌ 复制失败:', error)
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
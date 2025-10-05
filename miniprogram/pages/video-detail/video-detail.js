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

      console.log('📥 开始下载视频:', videoInfo.videoUrl)

      // 3. 使用 downloadFile 下载视频
      const downloadTask = wx.downloadFile({
        url: videoInfo.videoUrl,
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
              content: '需要您授权保存图片到相册的权限，请在设置中开启',
              confirmText: '去设置',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting({
                    success: (settingRes) => {
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        console.log('✅ 用户已在设置中授权')
                        resolve(true)
                      } else {
                        console.log('❌ 用户拒绝授权')
                        resolve(false)
                      }
                    },
                    fail: () => {
                      resolve(false)
                    }
                  })
                } else {
                  resolve(false)
                }
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
      // 复制视频下载链接
      await util.copyToClipboard(videoInfo.videoUrl)
      
      // 显示提示信息
      wx.showModal({
        title: '复制成功',
        content: '下载链接已复制到剪贴板，请粘贴至浏览器进行下载',
        showCancel: false,
        confirmText: '知道了'
      })
      
      console.log('✅ 视频下载链接已复制:', videoInfo.videoUrl)
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
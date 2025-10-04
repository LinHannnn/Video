// app.js
App({
  onLaunch() {
    console.log('🚀 小程序启动完成')
    
    // 初始化用户数据
    this.globalData = {
      userInfo: null,
      isLoggedIn: false,
      currentVideoInfo: null
    }
  },

  onShow() {
    console.log('📱 小程序显示')
  },

  onHide() {
    console.log('📱 小程序进入后台')
  },

  onError(msg) {
    console.error('❌ 小程序错误:', msg)
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentVideoInfo: null
  }
}) 
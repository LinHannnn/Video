// utils/util.js

// 格式化时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 显示Toast提示
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

// 显示Loading
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏Loading
const hideLoading = () => {
  wx.hideLoading()
}

// 显示模态对话框
const showModal = (title, content, showCancel = true) => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      showCancel,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 复制到剪贴板
const copyToClipboard = (data) => {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data,
      success: () => {
        showToast('复制成功', 'success')
        resolve()
      },
      fail: reject
    })
  })
}

// 从剪贴板获取内容
const getClipboardData = () => {
  return new Promise((resolve, reject) => {
    wx.getClipboardData({
      success: (res) => {
        resolve(res.data)
      },
      fail: reject
    })
  })
}

// 检查URL格式
const isValidUrl = (url) => {
  // 更宽松的URL检查，适用于各类短视频平台链接
  if (!url) return false;
  
  // 简单检查是否包含常见域名特征
  const hasCommonDomains = /(douyin|kuaishou|bilibili|weibo|xiaohongshu|huoshan|ixigua)\.com/i.test(url);
  
  // 检查是否包含http链接特征
  const hasHttpPattern = /https?:\/\/[a-z0-9][-a-z0-9]*(\.[a-z0-9][-a-z0-9]*)+/i.test(url);
  
  // 检查短链接格式
  const isShortUrl = /https?:\/\/[a-z0-9]{1,10}\.[a-z]{2,6}\/[a-z0-9-_]+/i.test(url);
  
  return hasCommonDomains || hasHttpPattern || isShortUrl;
}

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

module.exports = {
  formatTime,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  copyToClipboard,
  getClipboardData,
  isValidUrl,
  debounce
} 
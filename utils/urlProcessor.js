const { logger } = require('../config/logger');

/**
 * URL处理工具类
 * 根据不同平台对URL进行预处理
 */
class UrlProcessor {
  
  /**
   * 处理原始URL
   * @param {string} rawUrl - 原始URL
   * @param {string} platform - 平台类型，默认为'auto'
   * @returns {string} 处理后的URL
   */
  static process(rawUrl, platform = 'auto') {
    try {
      if (!rawUrl || typeof rawUrl !== 'string') {
        throw new Error('URL不能为空');
      }

      // 自动检测平台类型
      if (platform === 'auto') {
        platform = this.detectPlatform(rawUrl);
      }
      
      logger.info(`处理URL: ${rawUrl}, 平台: ${platform}`);
      
      switch (platform) {
        case 'douyin':
        case 'tiktok':
          return this.processDouyin(rawUrl);
          
        case 'bilibili':
          return this.processBilibili(rawUrl);
          
        case 'xiaohongshu':
          return this.processXiaohongshu(rawUrl);
          
        case 'kuaishou':
          return this.processKuaishou(rawUrl);
          
        default:
          return rawUrl.trim();
      }
    } catch (error) {
      logger.error('URL处理失败:', error);
      throw error;
    }
  }
  
  /**
   * 检测平台类型
   * @param {string} url - URL
   * @returns {string} 平台类型
   */
  static detectPlatform(url) {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('douyin.com') || lowerUrl.includes('tiktok.com')) {
      return 'douyin';
    }
    if (lowerUrl.includes('bilibili.com') || lowerUrl.includes('b23.tv')) {
      return 'bilibili';
    }
    if (lowerUrl.includes('xiaohongshu.com') || lowerUrl.includes('xhslink.com')) {
      return 'xiaohongshu';
    }
    if (lowerUrl.includes('kuaishou.com')) {
      return 'kuaishou';
    }
    
    return 'unknown';
  }
  
  /**
   * 处理抖音/TikTok URL
   * @param {string} rawUrl - 原始URL
   * @returns {string} 处理后的URL
   */
  static processDouyin(rawUrl) {
    // 抖音URL无需特殊处理，直接返回
    return rawUrl.trim();
  }
  
  /**
   * 处理哔哩哔哩URL
   * @param {string} rawUrl - 原始URL
   * @returns {string} 处理后的URL
   */
  static processBilibili(rawUrl) {
    // 提取https链接，去除前面的文本和表情
    const match = rawUrl.match(/https:\/\/[^\s\u4e00-\u9fa5]*/);
    if (match) {
      return match[0];
    }
    
    // 如果没有匹配到https链接，返回原URL
    return rawUrl.trim();
  }
  
  /**
   * 处理小红书URL
   * @param {string} rawUrl - 原始URL
   * @returns {string} 处理后的URL
   */
  static processXiaohongshu(rawUrl) {
    // 查找https开头的位置
    const httpsIndex = rawUrl.indexOf('https://');
    if (httpsIndex >= 0) {
      // 提取从https开始的部分
      let url = rawUrl.substring(httpsIndex);
      
             // 查找URL结束位置（遇到空格、emoji、中文等字符）
       // 小红书URL通常以参数结尾，保留完整的URL包括参数
       const endMatch = url.match(/^https:\/\/[^\s\u4e00-\u9fa5\u{1f600}-\u{1f64f}\u{1f300}-\u{1f5ff}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}]*/u);
       if (endMatch) {
         return endMatch[0];
       }
      
      // 如果正则匹配失败，尝试手动查找结束位置
      let endIndex = url.length;
      for (let i = 8; i < url.length; i++) { // 从https://后开始
        const char = url[i];
        // 遇到空格、中文、emoji等字符时停止
        if (char === ' ' || 
            (char >= '\u4e00' && char <= '\u9fa5') || // 中文
            (char >= '\ud800' && char <= '\udfff') || // emoji代理对
            /[\u{1f600}-\u{1f64f}]/u.test(char) || // emoji表情
            /[\u{1f300}-\u{1f5ff}]/u.test(char) || // emoji符号
            /[\u{1f680}-\u{1f6ff}]/u.test(char) || // emoji交通
            /[\u{2600}-\u{26ff}]/u.test(char)) {    // 其他符号
          endIndex = i;
          break;
        }
      }
      
      return url.substring(0, endIndex);
    }
    
         // 尝试匹配https链接（备用方案）
     const match = rawUrl.match(/https:\/\/[^\s\u4e00-\u9fa5\u{1f600}-\u{1f64f}\u{1f300}-\u{1f5ff}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}]*/u);
     if (match) {
       return match[0];
     }
    
    return rawUrl.trim();
  }
  
  /**
   * 处理快手URL
   * @param {string} rawUrl - 原始URL
   * @returns {string} 处理后的URL
   */
  static processKuaishou(rawUrl) {
    // 类似小红书处理方式
    const match = rawUrl.match(/https:\/\/[^\s\u4e00-\u9fa5]*/);
    if (match) {
      return match[0];
    }
    
    return rawUrl.trim();
  }
  
  /**
   * 验证URL格式（宽松验证，支持各种分享链接格式）
   * @param {string} url - URL
   * @returns {boolean} 是否为有效URL
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return false;
    }
    
    // 宽松的URL验证，只要包含常见的协议或域名模式即可
    const urlPattern = /^(https?:\/\/|\/\/)?[a-zA-Z0-9][\w.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}|^https?:\/\/[\w.-]+|v\.douyin\.com|kuaishou\.com|bilibili\.com|xiaohongshu\.com/i;
    
    // 特殊处理抖音分享链接格式
    if (url.includes('douyin.com') || url.includes('tiktok.com')) {
      return true; // 抖音链接格式特殊，直接通过
    }
    
    // 检查是否包含URL模式
    return urlPattern.test(url) || url.includes('http') || url.includes('www.');
  }
  
  /**
   * 获取支持的平台列表
   * @returns {Array} 支持的平台列表
   */
  static getSupportedPlatforms() {
    return [
      { key: 'douyin', name: '抖音/TikTok' },
      { key: 'bilibili', name: '哔哩哔哩' },
      { key: 'xiaohongshu', name: '小红书' },
      { key: 'kuaishou', name: '快手' }
    ];
  }
}

module.exports = UrlProcessor; 
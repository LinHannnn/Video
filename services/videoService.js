const axios = require('axios');
const { logger } = require('../config/logger');
const keyService = require('./keyService');
const UrlProcessor = require('../utils/urlProcessor');

/**
 * 视频解析服务
 */
class VideoService {
  
  constructor() {
    this.apiUrl = process.env.THIRD_PARTY_API_URL || 'https://www.52api.cn/api/video_parse';
    this.timeout = 10000; // 10秒超时
  }
  
  /**
   * 解析视频
   * @param {Object} parseData - 解析数据
   * @returns {Object} 解析结果
   */
  async parseVideo(parseData) {
    const startTime = Date.now();
    
    try {
      const { url, platform = 'auto', options = {} } = parseData;
      
      // URL预处理
      const processedUrl = UrlProcessor.process(url, platform);
      const detectedPlatform = UrlProcessor.detectPlatform(processedUrl);
      logger.info(`原始URL: ${url}, 处理后URL: ${processedUrl}, 检测平台: ${detectedPlatform}`);
      
      // 验证处理后的URL
      if (!UrlProcessor.isValidUrl(processedUrl)) {
        throw new Error('无效的URL格式');
      }
      
      // 获取可用的API密钥
      const apiKey = await keyService.getAvailableKey();
      
      // 调用第三方API，传递平台信息
      const apiResult = await this.callThirdPartyAPI(processedUrl, apiKey.key_value, detectedPlatform);
      
      // 处理API响应
      const result = this.processApiResponse(apiResult, options);
      
      const execTime = (Date.now() - startTime) / 1000;
      logger.info(`视频解析完成，耗时: ${execTime}秒`);
      
      return {
        success: true,
        data: result,
        execTime
      };
      
    } catch (error) {
      const execTime = (Date.now() - startTime) / 1000;
      logger.error('视频解析失败:', error);
      
      return {
        success: false,
        error: error.message,
        execTime
      };
    }
  }
  
  /**
   * 调用第三方API
   * @param {string} url - 视频URL
   * @param {string} apiKey - API密钥
   * @param {string} platform - 平台类型
   * @returns {Object} API响应
   */
  async callThirdPartyAPI(url, apiKey, platform = 'unknown') {
    try {
      // 小红书平台使用JSON格式的POST请求
      if (platform === 'xiaohongshu') {
        return await this.callThirdPartyAPIJson(url, apiKey);
      }
      
      // 其他平台使用GET方式
      const params = {
        key: apiKey,
        url: url
      };
      
      logger.info(`调用第三方API (${platform}): ${this.apiUrl}`, { params });
      
      const response = await axios.get(this.apiUrl, {
        params: params,
        headers: {
          'User-Agent': 'VideoExtractBot/1.0'
        },
        timeout: this.timeout
      });
      
      logger.info('第三方API调用成功', { 
        platform,
        status: response.status,
        responseCode: response.data?.code 
      });
      
      return response.data;
      
    } catch (error) {
      // 如果GET请求失败，尝试POST请求
      if (error.response?.status === 405 || error.code === 'ENOTFOUND') {
        logger.info('GET请求失败，尝试POST请求');
        return await this.callThirdPartyAPIPost(url, apiKey);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('API调用超时，请稍后重试');
      }
      
      if (error.response) {
        logger.error('API响应错误:', error.response.data);
        throw new Error(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      }
      
      if (error.request) {
        throw new Error('网络连接失败，请检查网络状态');
      }
      
      throw new Error(`API调用失败: ${error.message}`);
    }
  }

  /**
   * 使用JSON格式的POST方式调用第三方API（小红书专用）
   * @param {string} url - 视频URL
   * @param {string} apiKey - API密钥
   * @returns {Object} API响应
   */
  async callThirdPartyAPIJson(url, apiKey) {
    try {
      // URL编码（重要！）
      const encodedUrl = encodeURIComponent(url);
      
      const requestData = {
        key: apiKey,
        url: encodedUrl
      };
      
      const requestConfig = {
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Origin': 'https://www.52api.cn',
          'Referer': 'https://www.52api.cn/doc/64',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
        },
        timeout: this.timeout
      };
      
      logger.info(`使用JSON POST方式调用第三方API (小红书): ${this.apiUrl}`, { 
        originalUrl: url,
        encodedUrl: encodedUrl,
        requestData,
        requestHeaders: requestConfig.headers,
        method: 'POST',
        url: this.apiUrl
      });
      
      // 输出完整的cURL命令用于调试
      const curlCommand = `curl -X POST '${this.apiUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'User-Agent: VideoExtractBot/1.0' \\
  -d '${JSON.stringify(requestData)}'`;
      
      logger.info('等效的cURL命令:', { curlCommand });
      
      // 添加请求拦截器，记录实际发送的请求
      const axiosInstance = axios.create();
      axiosInstance.interceptors.request.use(
        (config) => {
          logger.info('实际发送的axios请求详情:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            data: config.data,
            timeout: config.timeout
          });
          return config;
        }
      );
      
      const response = await axiosInstance.post(this.apiUrl, requestData, requestConfig);
      
      logger.info('JSON POST API调用成功', { 
        status: response.status,
        responseCode: response.data?.code,
        responseMsg: response.data?.msg,
        responseData: response.data?.data
      });
      
      // 如果API返回错误，记录详细信息
      if (response.data?.code !== 200) {
        logger.warn('第三方API返回错误', {
          code: response.data?.code,
          msg: response.data?.msg,
          data: response.data?.data,
          fullResponse: response.data
        });
      }
      
      return response.data;
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('API调用超时，请稍后重试');
      }
      
      if (error.response) {
        logger.error('JSON POST API响应错误:', error.response.data);
        throw new Error(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      }
      
      if (error.request) {
        throw new Error('网络连接失败，请检查网络状态');
      }
      
      throw new Error(`API调用失败: ${error.message}`);
    }
  }

  /**
   * 使用POST方式调用第三方API（备用方案）
   * @param {string} url - 视频URL  
   * @param {string} apiKey - API密钥
   * @returns {Object} API响应
   */
  async callThirdPartyAPIPost(url, apiKey) {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        url: url
      });
      
      logger.info(`使用POST方式调用第三方API: ${this.apiUrl}`);
      
      const response = await axios.post(this.apiUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          'User-Agent': 'VideoExtractBot/1.0'
        },
        timeout: this.timeout
      });
      
      logger.info('POST API调用成功', { 
        status: response.status,
        responseCode: response.data?.code 
      });
      
      return response.data;
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('API调用超时，请稍后重试');
      }
      
      if (error.response) {
        logger.error('POST API响应错误:', error.response.data);
        throw new Error(`API调用失败: ${error.response.status} ${error.response.statusText}`);
      }
      
      if (error.request) {
        throw new Error('网络连接失败，请检查网络状态');
      }
      
      throw new Error(`API调用失败: ${error.message}`);
    }
  }
  
  /**
   * 处理API响应
   * @param {Object} apiResponse - API响应
   * @param {Object} options - 选项
   * @returns {Object} 处理后的结果
   */
  processApiResponse(apiResponse, options = {}) {
    try {
      // 检查API响应状态
      if (!apiResponse || typeof apiResponse !== 'object') {
        throw new Error('API响应格式错误');
      }
      
      // 根据第三方API的实际响应结构处理，只返回有效字段
      let processedData = {
        originalResponse: apiResponse // 保留原始响应用于调试
      };
      
      // 只添加有值的字段
      const platform = this.extractPlatform(apiResponse);
      if (platform && platform !== 'unknown') {
        processedData.platform = platform;
      }
      
      // 支持多种字段格式（第三方API可能返回不同的字段名）
      const title = apiResponse.title || apiResponse.data?.work_title;
      if (title) {
        processedData.title = title;
      }
      
      const author = apiResponse.author || apiResponse.data?.work_author;
      if (author) {
        processedData.author = author;
      }
      
      if (apiResponse.duration) {
        processedData.duration = apiResponse.duration;
      }
      
      // 提取视频大小（支持多种字段格式）
      const size = apiResponse.size || apiResponse.filesize || apiResponse.file_size || apiResponse.data?.size;
      if (size) {
        // 格式化视频大小
        processedData.size = this.formatFileSize(size);
      }
      
      const videoUrl = apiResponse.video_url || apiResponse.url || apiResponse.data?.work_url;
      if (videoUrl) {
        processedData.videoUrl = videoUrl;
      }
      
      const coverImage = apiResponse.cover || apiResponse.pic || apiResponse.data?.work_cover;
      if (coverImage) {
        processedData.coverImage = coverImage;
      }
      
      const description = apiResponse.description || apiResponse.desc || apiResponse.data?.work_desc;
      if (description) {
        processedData.description = description;
      }
      
      const workType = apiResponse.data?.work_type;
      if (workType) {
        processedData.type = workType;
      }
      
      // 根据选项进行额外处理
      if (options.preferredQuality) {
        processedData = this.selectVideoQuality(processedData, options.preferredQuality);
      }
      
      if (options.extractAudio && apiResponse.audio_url) {
        processedData.audioUrl = apiResponse.audio_url;
      }
      
      logger.info('API响应处理完成');
      return processedData;
      
    } catch (error) {
      logger.error('API响应处理失败:', error);
      throw new Error('解析结果处理失败');
    }
  }
  
  /**
   * 从API响应中提取平台信息
   * @param {Object} apiResponse - API响应
   * @returns {string} 平台名称
   */
  extractPlatform(apiResponse) {
    if (apiResponse.platform) {
      return apiResponse.platform;
    }
    
    // 尝试从其他字段推断平台
    if (apiResponse.source) {
      return apiResponse.source;
    }
    
    return '未知平台';
  }
  
  /**
   * 格式化文件大小
   * @param {number|string} size - 文件大小（字节数或已格式化的字符串）
   * @returns {string} 格式化后的大小字符串（如 "89.01MB"）
   */
  formatFileSize(size) {
    // 如果已经是格式化的字符串，直接返回
    if (typeof size === 'string') {
      // 如果已经包含MB或KB等单位，直接返回
      if (size.match(/\d+(\.\d+)?\s*(MB|KB|GB|B)/i)) {
        return size;
      }
      // 尝试转换为数字
      size = parseFloat(size);
      if (isNaN(size)) {
        return size; // 如果无法转换，返回原字符串
      }
    }
    
    // 如果是数字，转换为MB
    if (typeof size === 'number') {
      const sizeInMB = size / (1024 * 1024);
      return `${sizeInMB.toFixed(2)}MB`;
    }
    
    return '未知';
  }
  
  /**
   * 选择视频质量
   * @param {Object} data - 视频数据
   * @param {string} quality - 期望质量
   * @returns {Object} 处理后的数据
   */
  selectVideoQuality(data, quality) {
    // 如果API返回多个质量选项，根据偏好选择
    if (data.videoUrls && Array.isArray(data.videoUrls)) {
      const qualityMap = {
        'high': ['1080p', '720p', '480p'],
        'medium': ['720p', '480p', '360p'],
        'low': ['480p', '360p', '240p']
      };
      
      const preferredQualities = qualityMap[quality] || qualityMap['medium'];
      
      for (const preferredQuality of preferredQualities) {
        const foundUrl = data.videoUrls.find(item => 
          item.quality === preferredQuality
        );
        if (foundUrl) {
          data.videoUrl = foundUrl.url;
          data.selectedQuality = foundUrl.quality;
          break;
        }
      }
    }
    
    return data;
  }
  
  /**
   * 验证解析结果
   * @param {Object} data - 解析数据
   * @returns {boolean} 是否有效
   */
  validateParseResult(data) {
    return !!(data.videoUrl || data.audioUrl);
  }
  
  /**
   * 获取支持的平台列表
   * @returns {Array} 支持的平台列表
   */
  getSupportedPlatforms() {
    return UrlProcessor.getSupportedPlatforms();
  }
}

module.exports = new VideoService(); 
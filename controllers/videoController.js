const videoService = require('../services/videoService');
const VideoValidator = require('../validators/videoValidator');
const { logger } = require('../config/logger');
const axios = require('axios');

/**
 * 视频解析控制器
 */
class VideoController {
  
  /**
   * 解析视频
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async parseVideo(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      // 数据验证 - 支持简化格式（只有URL）和完整格式
      const validation = VideoValidator.validateParseRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          code: 400,
          msg: '请求参数验证失败',
          data: null,
          errors: validation.errors,
          debug: process.env.NODE_ENV === 'development' ? validation.errors : null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      // 解构数据，设置默认值
      const { url } = validation.data;
      const platform = validation.data.platform || 'auto';
      const options = validation.data.options || { preferredQuality: 'high', extractAudio: false };
      
      // 检查是否为支持的平台
      if (!VideoValidator.isSupportedPlatform(url)) {
        return res.status(400).json({
          code: 400,
          msg: '不支持的平台，请检查URL是否来自支持的平台',
          data: null,
          debug: process.env.NODE_ENV === 'development' ? { supportedPlatforms: videoService.getSupportedPlatforms() } : null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      logger.info(`开始解析视频: ${url}, 平台: ${platform}`, { clientIp });
      
      // 调用视频解析服务
      const result = await videoService.parseVideo({
        url,
        platform,
        options
      });
      
      if (result.success) {
        // 解析成功
        return res.status(200).json({
          code: 200,
          msg: '解析成功',
          data: result.data,
          debug: null,
          exec_time: result.execTime,
          user_ip: clientIp
        });
      } else {
        // 解析失败
        return res.status(500).json({
          code: 500,
          msg: result.error || '视频解析失败',
          data: null,
          debug: process.env.NODE_ENV === 'development' ? result.error : null,
          exec_time: result.execTime,
          user_ip: clientIp
        });
      }
      
    } catch (error) {
      logger.error('视频解析控制器错误:', error);
      
      return res.status(500).json({
        code: 500,
        msg: '服务器内部错误',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 获取支持的平台列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getSupportedPlatforms(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      const platforms = videoService.getSupportedPlatforms();
      
      return res.status(200).json({
        code: 200,
        msg: '获取成功',
        data: {
          platforms,
          total: platforms.length
        },
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('获取平台列表错误:', error);
      
      return res.status(500).json({
        code: 500,
        msg: '获取平台列表失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 健康检查接口
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async healthCheck(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      // 检查数据库状态
      let dbStatus = 'unknown';
      try {
        const { testConnection } = require('../config/database');
        const dbConnected = await testConnection();
        dbStatus = dbConnected ? 'connected' : 'disconnected';
      } catch (error) {
        dbStatus = 'error';
      }
      
      return res.status(200).json({
        code: 200,
        msg: '服务正常',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          node_version: process.version,
          uptime: process.uptime(),
          database: dbStatus,
          features: {
            video_parsing: true,
            key_management: dbStatus === 'connected'
          }
        },
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('健康检查错误:', error);
      
      return res.status(500).json({
        code: 500,
        msg: '服务异常',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 视频下载代理
   * 添加 Content-Disposition 响应头，强制浏览器下载而不是播放
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async downloadVideo(req, res) {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      // 获取视频URL参数
      const { url, title } = req.query;
      
      if (!url) {
        return res.status(400).json({
          code: 400,
          msg: '缺少url参数',
          data: null
        });
      }
      
      logger.info(`视频下载请求: ${url}`, { clientIp });
      
      // 生成文件名
      const timestamp = Date.now();
      const filename = title 
        ? `${title.substring(0, 50)}_${timestamp}.mp4`
        : `video_${timestamp}.mp4`;
      
      // 从源服务器获取视频流
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 60000, // 60秒超时
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // 设置响应头，强制下载
      // 使用 application/octet-stream 强制浏览器下载而不是预览
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // 如果源服务器提供了文件大小，也传递给客户端
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }
      
      // 将视频流转发给客户端
      response.data.pipe(res);
      
      // 处理流错误
      response.data.on('error', (error) => {
        logger.error('视频流传输错误:', error);
        if (!res.headersSent) {
          res.status(500).json({
            code: 500,
            msg: '视频下载失败',
            data: null
          });
        }
      });
      
      logger.info('视频下载完成', { clientIp, filename });
      
    } catch (error) {
      logger.error('视频下载代理错误:', error);
      
      if (!res.headersSent) {
        return res.status(500).json({
          code: 500,
          msg: '视频下载失败',
          data: null,
          debug: process.env.NODE_ENV === 'development' ? error.message : null
        });
      }
    }
  }
}

module.exports = new VideoController(); 
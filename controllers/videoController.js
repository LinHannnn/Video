const videoService = require('../services/videoService');
const VideoValidator = require('../validators/videoValidator');
const { logger } = require('../config/logger');

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
}

module.exports = new VideoController(); 
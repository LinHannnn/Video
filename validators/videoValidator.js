const Joi = require('joi');

/**
 * 视频解析请求验证器
 */
class VideoValidator {
  
  /**
   * 视频解析请求验证规则（简化版 - 只需要URL）
   */
  static get parseVideoSchema() {
    return Joi.object({
      url: Joi.string()
        .required()
        .min(10)
        .max(2000)
        .trim()
        .messages({
          'string.empty': 'URL不能为空',
          'string.min': 'URL长度不能少于10个字符',
          'string.max': 'URL长度不能超过2000个字符',
          'any.required': 'URL字段是必需的'
        })
    });
  }

  /**
   * 视频解析请求验证规则（完整版 - 兼容旧格式）
   */
  static get parseVideoSchemaFull() {
    return Joi.object({
      url: Joi.string()
        .required()
        .min(10)
        .max(2000)
        .trim()
        .messages({
          'string.empty': 'URL不能为空',
          'string.min': 'URL长度不能少于10个字符',
          'string.max': 'URL长度不能超过2000个字符',
          'any.required': 'URL字段是必需的'
        }),
      
      platform: Joi.string()
        .valid('auto', 'douyin', 'tiktok', 'bilibili', 'xiaohongshu', 'kuaishou')
        .default('auto')
        .messages({
          'any.only': '不支持的平台类型'
        }),
      
      options: Joi.object({
        preferredQuality: Joi.string()
          .valid('high', 'medium', 'low')
          .optional()
          .messages({
            'any.only': '视频质量只能是 high、medium 或 low'
          }),
        
        extractAudio: Joi.boolean()
          .default(false)
          .optional()
      }).optional().default({})
    });
  }
  
  /**
   * 抖音/TikTok 特定验证
   */
  static get douyinSchema() {
    return Joi.object({
      platform: Joi.string().valid('douyin', 'tiktok'),
      url: Joi.string().required().min(10).max(500),
      options: Joi.object().optional()
    });
  }
  
  /**
   * 哔哩哔哩特定验证
   */
  static get bilibiliSchema() {
    return Joi.object({
      platform: Joi.string().valid('bilibili'),
      url: Joi.string().required().min(10).max(1000), // 允许更长，因为包含分享文本
      options: Joi.object({
        videoType: Joi.string().valid('single', 'collection').default('single'),
        preferredQuality: Joi.string().valid('high', 'medium', 'low').optional(),
        extractAudio: Joi.boolean().default(false).optional()
      }).optional()
    });
  }
  
  /**
   * 小红书特定验证
   */
  static get xiaohongshuSchema() {
    return Joi.object({
      platform: Joi.string().valid('xiaohongshu'),
      url: Joi.string().required().min(10).max(1000),
      options: Joi.object({
        noteType: Joi.string().valid('video', 'image').default('video'),
        preferredQuality: Joi.string().valid('high', 'medium', 'low').optional(),
        extractAudio: Joi.boolean().default(false).optional()
      }).optional()
    });
  }
  
  /**
   * 快手特定验证
   */
  static get kuaishouSchema() {
    return Joi.object({
      platform: Joi.string().valid('kuaishou'),
      url: Joi.string().required().min(10).max(500),
      options: Joi.object({
        preferredQuality: Joi.string().valid('high', 'medium', 'low').optional(),
        extractAudio: Joi.boolean().default(false).optional()
      }).optional()
    });
  }
  
  /**
   * 验证视频解析请求
   * @param {Object} data - 请求数据
   * @returns {Object} 验证结果
   */
  static validateParseRequest(data) {
    try {
      // 首先进行通用验证
      const { error, value } = this.parseVideoSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          })),
          data: null
        };
      }
      
      // 如果指定了平台，进行平台特定验证
      if (value.platform !== 'auto') {
        const platformValidation = this.validateByPlatform(value);
        if (!platformValidation.isValid) {
          return platformValidation;
        }
      }
      
      return {
        isValid: true,
        errors: null,
        data: value
      };
      
    } catch (err) {
      return {
        isValid: false,
        errors: [{ field: 'general', message: '数据验证失败' }],
        data: null
      };
    }
  }
  
  /**
   * 根据平台进行特定验证
   * @param {Object} data - 验证数据
   * @returns {Object} 验证结果
   */
  static validateByPlatform(data) {
    let schema;
    
    switch (data.platform) {
      case 'douyin':
      case 'tiktok':
        schema = this.douyinSchema;
        break;
      case 'bilibili':
        schema = this.bilibiliSchema;
        break;
      case 'xiaohongshu':
        schema = this.xiaohongshuSchema;
        break;
      case 'kuaishou':
        schema = this.kuaishouSchema;
        break;
      default:
        return { isValid: true, errors: null, data };
    }
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        data: null
      };
    }
    
    return {
      isValid: true,
      errors: null,
      data: value
    };
  }
  
  /**
   * 验证URL格式
   * @param {string} url - URL
   * @returns {boolean} 是否为有效URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 检查URL是否包含支持的平台域名
   * @param {string} url - URL
   * @returns {boolean} 是否为支持的平台
   */
  static isSupportedPlatform(url) {
    const supportedDomains = [
      'douyin.com',
      'tiktok.com',
      'bilibili.com',
      'b23.tv',
      'xiaohongshu.com',
      'xhslink.com',
      'kuaishou.com'
    ];
    
    const lowerUrl = url.toLowerCase();
    return supportedDomains.some(domain => lowerUrl.includes(domain));
  }
}

module.exports = VideoValidator; 
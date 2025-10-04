const Joi = require('joi');

/**
 * API密钥管理验证器
 */
class KeyValidator {
  
  /**
   * 创建密钥验证规则
   */
  static get createKeySchema() {
    return Joi.object({
      keyName: Joi.string()
        .required()
        .min(2)
        .max(100)
        .trim()
        .pattern(/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/)
        .messages({
          'string.empty': '密钥名称不能为空',
          'string.min': '密钥名称至少需要2个字符',
          'string.max': '密钥名称不能超过100个字符',
          'string.pattern.base': '密钥名称只能包含中文、英文、数字、下划线、连字符和空格',
          'any.required': '密钥名称是必需的'
        }),
      
      keyValue: Joi.string()
        .required()
        .min(10)
        .max(255)
        .trim()
        .messages({
          'string.empty': '密钥值不能为空',
          'string.min': '密钥值至少需要10个字符',
          'string.max': '密钥值不能超过255个字符',
          'any.required': '密钥值是必需的'
        }),
      
      description: Joi.string()
        .optional()
        .allow('')
        .max(500)
        .trim()
        .messages({
          'string.max': '描述不能超过500个字符'
        })
    });
  }
  
  /**
   * 更新密钥验证规则
   */
  static get updateKeySchema() {
    return Joi.object({
      keyName: Joi.string()
        .optional()
        .min(2)
        .max(100)
        .trim()
        .pattern(/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/)
        .messages({
          'string.min': '密钥名称至少需要2个字符',
          'string.max': '密钥名称不能超过100个字符',
          'string.pattern.base': '密钥名称只能包含中文、英文、数字、下划线、连字符和空格'
        }),
      
      keyValue: Joi.string()
        .optional()
        .min(10)
        .max(255)
        .trim()
        .messages({
          'string.min': '密钥值至少需要10个字符',
          'string.max': '密钥值不能超过255个字符'
        }),
      
      status: Joi.string()
        .optional()
        .valid('active', 'inactive')
        .messages({
          'any.only': '状态只能是 active 或 inactive'
        }),
      
      description: Joi.string()
        .optional()
        .allow('')
        .max(500)
        .trim()
        .messages({
          'string.max': '描述不能超过500个字符'
        })
    }).min(1).messages({
      'object.min': '至少需要提供一个要更新的字段'
    });
  }
  
  /**
   * 密钥ID验证规则
   */
  static get keyIdSchema() {
    return Joi.object({
      keyId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.base': '密钥ID必须是数字',
          'number.integer': '密钥ID必须是整数',
          'number.positive': '密钥ID必须是正数',
          'any.required': '密钥ID是必需的'
        })
    });
  }
  
  /**
   * 批量操作验证规则
   */
  static get batchOperationSchema() {
    return Joi.object({
      keyIds: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .max(50)
        .unique()
        .required()
        .messages({
          'array.min': '至少需要选择一个密钥',
          'array.max': '一次最多只能操作50个密钥',
          'array.unique': '密钥ID不能重复',
          'any.required': '密钥ID列表是必需的'
        }),
      
      status: Joi.string()
        .valid('active', 'inactive')
        .required()
        .messages({
          'any.only': '状态只能是 active 或 inactive',
          'any.required': '状态是必需的'
        })
    });
  }
  
  /**
   * 验证创建密钥请求
   * @param {Object} data - 请求数据
   * @returns {Object} 验证结果
   */
  static validateCreateKey(data) {
    return this.validate(this.createKeySchema, data);
  }
  
  /**
   * 验证更新密钥请求
   * @param {Object} data - 请求数据
   * @returns {Object} 验证结果
   */
  static validateUpdateKey(data) {
    return this.validate(this.updateKeySchema, data);
  }
  
  /**
   * 验证密钥ID
   * @param {Object} data - 请求数据
   * @returns {Object} 验证结果
   */
  static validateKeyId(data) {
    return this.validate(this.keyIdSchema, data);
  }
  
  /**
   * 验证批量操作请求
   * @param {Object} data - 请求数据
   * @returns {Object} 验证结果
   */
  static validateBatchOperation(data) {
    return this.validate(this.batchOperationSchema, data);
  }
  
  /**
   * 通用验证方法
   * @param {Object} schema - 验证规则
   * @param {Object} data - 要验证的数据
   * @returns {Object} 验证结果
   */
  static validate(schema, data) {
    try {
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });
      
      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          })),
          data: null
        };
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
   * 验证密钥值格式（根据实际API密钥格式调整）
   * @param {string} keyValue - 密钥值
   * @returns {boolean} 是否为有效格式
   */
  static isValidKeyFormat(keyValue) {
    if (!keyValue || typeof keyValue !== 'string') {
      return false;
    }
    
    // 检查长度
    if (keyValue.length < 10 || keyValue.length > 255) {
      return false;
    }
    
    // 检查是否包含非法字符（根据实际API密钥格式调整）
    const validPattern = /^[a-zA-Z0-9_\-]+$/;
    return validPattern.test(keyValue);
  }
  
  /**
   * 检查密钥名称是否合法
   * @param {string} keyName - 密钥名称
   * @returns {boolean} 是否合法
   */
  static isValidKeyName(keyName) {
    if (!keyName || typeof keyName !== 'string') {
      return false;
    }
    
    const trimmedName = keyName.trim();
    
    // 检查长度
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return false;
    }
    
    // 检查字符
    const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/;
    return validPattern.test(trimmedName);
  }
}

module.exports = KeyValidator; 
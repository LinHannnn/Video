const keyService = require('../services/keyService');
const KeyValidator = require('../validators/keyValidator');
const { logger } = require('../config/logger');

/**
 * API密钥管理控制器
 */
class KeyController {
  
  /**
   * 获取密钥列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getKeys(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      const keys = await keyService.getAllKeys();
      
      // 格式化返回数据
      const formattedKeys = keys.map(key => ({
        id: key.id,
        keyName: key.key_name,
        keyValue: key.key_value, // 根据需求文档，显示完整密钥
        status: key.status,
        description: key.description,
        createdAt: key.created_at,
        updatedAt: key.updated_at
      }));
      
      return res.status(200).json({
        code: 200,
        msg: '获取成功',
        data: formattedKeys,
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('获取密钥列表失败:', error);
      
      return res.status(500).json({
        code: 500,
        msg: '获取密钥列表失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 根据ID获取密钥详情
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getKeyById(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      const keyId = parseInt(req.params.keyId);
      
      // 验证ID
      const validation = KeyValidator.validateKeyId({ keyId });
      if (!validation.isValid) {
        return res.status(400).json({
          code: 400,
          msg: '密钥ID无效',
          data: null,
          errors: validation.errors,
          debug: process.env.NODE_ENV === 'development' ? validation.errors : null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      const key = await keyService.getKeyById(keyId);
      
      if (!key) {
        return res.status(404).json({
          code: 404,
          msg: '密钥不存在',
          data: null,
          debug: null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      // 格式化返回数据
      const formattedKey = {
        id: key.id,
        keyName: key.key_name,
        keyValue: key.key_value,
        status: key.status,
        description: key.description,
        createdAt: key.created_at,
        updatedAt: key.updated_at
      };
      
      return res.status(200).json({
        code: 200,
        msg: '获取成功',
        data: formattedKey,
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('获取密钥详情失败:', error);
      
      return res.status(500).json({
        code: 500,
        msg: '获取密钥详情失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 添加新密钥
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createKey(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      // 数据验证
      const validation = KeyValidator.validateCreateKey(req.body);
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
      
      const { keyName, keyValue, description } = validation.data;
      
      logger.info(`创建新密钥: ${keyName}`, { clientIp });
      
      // 创建密钥
      const keyId = await keyService.createKey({
        keyName,
        keyValue,
        description
      });
      
      return res.status(200).json({
        code: 200,
        msg: '添加成功',
        data: {
          id: keyId,
          keyName: keyName,
          status: 'active'
        },
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('添加密钥失败:', error);
      
      // 处理特定错误
      if (error.message === '密钥名称已存在') {
        return res.status(400).json({
          code: 400,
          msg: '密钥名称已存在',
          data: null,
          debug: null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      return res.status(500).json({
        code: 500,
        msg: '添加密钥失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 更新密钥
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateKey(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      const keyId = parseInt(req.params.keyId);
      
      // 验证ID
      const idValidation = KeyValidator.validateKeyId({ keyId });
      if (!idValidation.isValid) {
        return res.status(400).json({
          code: 400,
          msg: '密钥ID无效',
          data: null,
          errors: idValidation.errors,
          debug: process.env.NODE_ENV === 'development' ? idValidation.errors : null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      // 验证更新数据
      const validation = KeyValidator.validateUpdateKey(req.body);
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
      
      logger.info(`更新密钥: ID ${keyId}`, { clientIp });
      
      // 更新密钥
      await keyService.updateKey(keyId, validation.data);
      
      return res.status(200).json({
        code: 200,
        msg: '更新成功',
        data: null,
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('更新密钥失败:', error);
      
      // 处理特定错误
      if (error.message === '密钥不存在') {
        return res.status(404).json({
          code: 404,
          msg: '密钥不存在',
          data: null,
          debug: null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      if (error.message === '密钥名称已存在') {
        return res.status(400).json({
          code: 400,
          msg: '密钥名称已存在',
          data: null,
          debug: null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      return res.status(500).json({
        code: 500,
        msg: '更新密钥失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 删除密钥
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteKey(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      const keyId = parseInt(req.params.keyId);
      
      // 验证ID
      const validation = KeyValidator.validateKeyId({ keyId });
      if (!validation.isValid) {
        return res.status(400).json({
          code: 400,
          msg: '密钥ID无效',
          data: null,
          errors: validation.errors,
          debug: process.env.NODE_ENV === 'development' ? validation.errors : null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      logger.info(`删除密钥: ID ${keyId}`, { clientIp });
      
      // 删除密钥
      await keyService.deleteKey(keyId);
      
      return res.status(200).json({
        code: 200,
        msg: '删除成功',
        data: null,
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('删除密钥失败:', error);
      
      // 处理特定错误
      if (error.message === '密钥不存在') {
        return res.status(404).json({
          code: 404,
          msg: '密钥不存在',
          data: null,
          debug: null,
          exec_time: (Date.now() - startTime) / 1000,
          user_ip: clientIp
        });
      }
      
      return res.status(500).json({
        code: 500,
        msg: '删除密钥失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
  
  /**
   * 批量更新密钥状态
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async batchUpdateStatus(req, res) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
      // 数据验证
      const validation = KeyValidator.validateBatchOperation(req.body);
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
      
      const { keyIds, status } = validation.data;
      
      logger.info(`批量更新密钥状态: ${keyIds.length}个密钥 -> ${status}`, { clientIp });
      
      // 批量更新
      await keyService.batchUpdateStatus(keyIds, status);
      
      return res.status(200).json({
        code: 200,
        msg: `成功更新${keyIds.length}个密钥状态`,
        data: {
          updatedCount: keyIds.length,
          status: status
        },
        debug: null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
      
    } catch (error) {
      logger.error('批量更新密钥状态失败:', error);
      
      return res.status(500).json({
        code: 500,
        msg: '批量更新失败',
        data: null,
        debug: process.env.NODE_ENV === 'development' ? error.message : null,
        exec_time: (Date.now() - startTime) / 1000,
        user_ip: clientIp
      });
    }
  }
}

module.exports = new KeyController(); 
const { query } = require('../config/database');
const { logger } = require('../config/logger');

/**
 * API密钥管理服务
 */
class KeyService {
  
  /**
   * 获取所有密钥
   * @returns {Array} 密钥列表
   */
  async getAllKeys() {
    try {
      const sql = 'SELECT id, key_name, key_value, status, description, created_at, updated_at FROM api_keys ORDER BY created_at DESC';
      const keys = await query(sql);
      
      logger.info(`获取密钥列表，共${keys.length}个密钥`);
      return keys;
    } catch (error) {
      logger.error('获取密钥列表失败:', error);
      throw new Error('获取密钥列表失败');
    }
  }
  
  /**
   * 获取活跃密钥列表
   * @returns {Array} 活跃密钥列表
   */
  async getActiveKeys() {
    try {
      const sql = 'SELECT id, key_name, key_value, status, description FROM api_keys WHERE status = ? ORDER BY created_at ASC';
      const keys = await query(sql, ['active']);
      
      logger.info(`获取活跃密钥，共${keys.length}个密钥`);
      return keys;
    } catch (error) {
      logger.error('获取活跃密钥失败:', error);
      throw new Error('获取活跃密钥失败');
    }
  }
  
  /**
   * 获取可用的API密钥（简单轮询策略）
   * @returns {Object} 可用密钥
   */
  async getAvailableKey() {
    try {
      const activeKeys = await this.getActiveKeys();
      
      if (activeKeys.length === 0) {
        throw new Error('没有可用的API密钥');
      }
      
      // 简单轮询策略：随机选择一个活跃密钥
      const randomIndex = Math.floor(Math.random() * activeKeys.length);
      const selectedKey = activeKeys[randomIndex];
      
      logger.info(`选择密钥: ${selectedKey.key_name}`);
      return selectedKey;
    } catch (error) {
      logger.error('获取可用密钥失败:', error);
      throw error;
    }
  }
  
  /**
   * 根据ID获取密钥
   * @param {number} keyId - 密钥ID
   * @returns {Object|null} 密钥信息
   */
  async getKeyById(keyId) {
    try {
      const sql = 'SELECT id, key_name, key_value, status, description, created_at, updated_at FROM api_keys WHERE id = ?';
      const keys = await query(sql, [keyId]);
      
      if (keys.length === 0) {
        return null;
      }
      
      logger.info(`获取密钥详情: ${keys[0].key_name}`);
      return keys[0];
    } catch (error) {
      logger.error('获取密钥详情失败:', error);
      throw new Error('获取密钥详情失败');
    }
  }
  
  /**
   * 添加新密钥
   * @param {Object} keyData - 密钥数据
   * @returns {number} 新增密钥的ID
   */
  async createKey(keyData) {
    try {
      const { keyName, keyValue, description = null } = keyData;
      
      // 检查密钥名称是否已存在
      const existingKey = await query('SELECT id FROM api_keys WHERE key_name = ?', [keyName]);
      if (existingKey.length > 0) {
        throw new Error('密钥名称已存在');
      }
      
      const sql = 'INSERT INTO api_keys (key_name, key_value, description) VALUES (?, ?, ?)';
      const result = await query(sql, [keyName, keyValue, description]);
      
      logger.info(`添加新密钥成功: ${keyName}, ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('添加密钥失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新密钥
   * @param {number} keyId - 密钥ID
   * @param {Object} updateData - 更新数据
   * @returns {boolean} 更新是否成功
   */
  async updateKey(keyId, updateData) {
    try {
      const fields = [];
      const values = [];
      
      // 动态构建更新字段
      if (updateData.keyName !== undefined) {
        // 检查新名称是否与其他密钥冲突
        const existingKey = await query('SELECT id FROM api_keys WHERE key_name = ? AND id != ?', [updateData.keyName, keyId]);
        if (existingKey.length > 0) {
          throw new Error('密钥名称已存在');
        }
        fields.push('key_name = ?');
        values.push(updateData.keyName);
      }
      
      if (updateData.keyValue !== undefined) {
        fields.push('key_value = ?');
        values.push(updateData.keyValue);
      }
      
      if (updateData.status !== undefined) {
        fields.push('status = ?');
        values.push(updateData.status);
      }
      
      if (updateData.description !== undefined) {
        fields.push('description = ?');
        values.push(updateData.description);
      }
      
      if (fields.length === 0) {
        throw new Error('没有需要更新的字段');
      }
      
      values.push(keyId);
      
      const sql = `UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?`;
      const result = await query(sql, values);
      
      if (result.affectedRows === 0) {
        throw new Error('密钥不存在');
      }
      
      logger.info(`更新密钥成功: ID ${keyId}`);
      return true;
    } catch (error) {
      logger.error('更新密钥失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除密钥
   * @param {number} keyId - 密钥ID
   * @returns {boolean} 删除是否成功
   */
  async deleteKey(keyId) {
    try {
      const sql = 'DELETE FROM api_keys WHERE id = ?';
      const result = await query(sql, [keyId]);
      
      if (result.affectedRows === 0) {
        throw new Error('密钥不存在');
      }
      
      logger.info(`删除密钥成功: ID ${keyId}`);
      return true;
    } catch (error) {
      logger.error('删除密钥失败:', error);
      throw error;
    }
  }
  
  /**
   * 批量更新密钥状态
   * @param {Array} keyIds - 密钥ID数组
   * @param {string} status - 新状态
   * @returns {boolean} 更新是否成功
   */
  async batchUpdateStatus(keyIds, status) {
    try {
      if (!keyIds || keyIds.length === 0) {
        throw new Error('密钥ID列表不能为空');
      }
      
      const placeholders = keyIds.map(() => '?').join(',');
      const sql = `UPDATE api_keys SET status = ? WHERE id IN (${placeholders})`;
      const params = [status, ...keyIds];
      
      const result = await query(sql, params);
      
      logger.info(`批量更新密钥状态成功: ${result.affectedRows}个密钥`);
      return true;
    } catch (error) {
      logger.error('批量更新密钥状态失败:', error);
      throw error;
    }
  }
}

module.exports = new KeyService(); 
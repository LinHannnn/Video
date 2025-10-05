-- ============================================
-- 公告表创建脚本
-- ============================================
-- 功能：管理小程序首页滚动公告
-- 使用方式：在数据库中执行此脚本
-- ============================================

-- 创建公告表
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
  `content` TEXT NOT NULL COMMENT '公告内容',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `priority` INT DEFAULT 0 COMMENT '优先级：数字越大优先级越高',
  `start_time` TIMESTAMP NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` TIMESTAMP NULL DEFAULT NULL COMMENT '结束时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` VARCHAR(100) DEFAULT NULL COMMENT '创建人',
  
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- 插入默认公告
INSERT INTO `announcements` (`content`, `status`, `priority`) VALUES 
('🎉 欢迎使用视频解析小程序！支持抖音、快手、B站等多平台视频解析', 1, 10),
('📢 登录后即可使用全部功能，快来体验吧！', 1, 5);

-- 查看创建结果
SELECT * FROM announcements;

-- 显示成功信息
SELECT '✅ 公告表创建完成！' AS message;

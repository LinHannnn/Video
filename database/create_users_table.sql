-- ============================================
-- 用户表创建脚本
-- ============================================
-- 功能：记录所有登录用户的信息
-- 使用方式：在数据库中执行此脚本
-- ============================================

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `openid` VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid（唯一标识）',
  `unionid` VARCHAR(100) DEFAULT NULL COMMENT '微信unionid（多小程序统一标识）',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `nickname` VARCHAR(100) DEFAULT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `country` VARCHAR(50) DEFAULT NULL COMMENT '国家',
  `province` VARCHAR(50) DEFAULT NULL COMMENT '省份',
  `city` VARCHAR(50) DEFAULT NULL COMMENT '城市',
  `language` VARCHAR(20) DEFAULT NULL COMMENT '语言',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `last_login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后登录时间',
  `login_count` INT DEFAULT 0 COMMENT '登录次数',
  `parse_count` INT DEFAULT 0 COMMENT '视频解析次数',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  
  INDEX `idx_openid` (`openid`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建用户登录日志表
CREATE TABLE IF NOT EXISTS `user_login_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `login_type` ENUM('wechat', 'phone', 'guest') DEFAULT 'wechat' COMMENT '登录类型',
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  `device_info` TEXT DEFAULT NULL COMMENT '设备信息',
  `platform` VARCHAR(20) DEFAULT NULL COMMENT '平台：iOS/Android',
  `version` VARCHAR(20) DEFAULT NULL COMMENT '小程序版本',
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_login_time` (`login_time`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';

-- 创建视频解析记录表
CREATE TABLE IF NOT EXISTS `parse_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `video_url` VARCHAR(1000) NOT NULL COMMENT '原始视频链接',
  `platform` VARCHAR(50) DEFAULT NULL COMMENT '平台：抖音/快手/B站等',
  `video_title` VARCHAR(500) DEFAULT NULL COMMENT '视频标题',
  `author` VARCHAR(100) DEFAULT NULL COMMENT '作者',
  `parse_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '解析时间',
  `success` TINYINT DEFAULT 1 COMMENT '是否成功：1成功 0失败',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_parse_time` (`parse_time`),
  INDEX `idx_platform` (`platform`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频解析记录表';

-- 查看创建结果
SHOW TABLES;

-- 查看用户表结构
DESC users;

-- 显示成功信息
SELECT '✅ 数据库表创建完成！' AS message;

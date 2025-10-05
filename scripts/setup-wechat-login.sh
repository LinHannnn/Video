#!/bin/bash
# setup-wechat-login.sh - 微信登录功能一键配置脚本

echo "🚀 开始配置微信登录功能..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，将创建新文件${NC}"
    touch .env
fi

# 检查是否已配置 WX_APPSECRET
if grep -q "WX_APPSECRET=" .env; then
    echo -e "${GREEN}✅ 已检测到 WX_APPSECRET 配置${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 WX_APPSECRET 配置${NC}"
    echo ""
    echo -e "${BLUE}请按照以下步骤获取 AppSecret：${NC}"
    echo "1. 访问：https://mp.weixin.qq.com/"
    echo "2. 登录您的小程序账号"
    echo "3. 进入：开发 → 开发管理 → 开发设置"
    echo "4. 找到 AppSecret 点击【重置】或【查看】"
    echo "5. 扫码验证后获取 AppSecret"
    echo ""
    
    # 提示用户输入
    read -p "请输入您的 WX_APPSECRET（回车跳过）: " wx_secret
    
    if [ -n "$wx_secret" ]; then
        # 检查是否已存在 WX_APPID
        if ! grep -q "WX_APPID=" .env; then
            echo "WX_APPID=wx638ec29150825d0d" >> .env
        fi
        echo "WX_APPSECRET=$wx_secret" >> .env
        echo -e "${GREEN}✅ WX_APPSECRET 配置成功${NC}"
    else
        echo -e "${YELLOW}⏭️  跳过 WX_APPSECRET 配置${NC}"
    fi
fi

# 检查 JWT_SECRET
if grep -q "JWT_SECRET=" .env; then
    echo -e "${GREEN}✅ 已检测到 JWT_SECRET 配置${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 JWT_SECRET 配置${NC}"
    
    # 生成随机 JWT_SECRET
    jwt_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "JWT_SECRET=$jwt_secret" >> .env
    echo "JWT_EXPIRES_IN=7d" >> .env
    echo -e "${GREEN}✅ JWT_SECRET 自动生成并配置${NC}"
fi

echo ""
echo -e "${BLUE}📋 当前配置：${NC}"
echo "----------------------------------------"
grep "WX_APPID\|WX_APPSECRET\|JWT_SECRET" .env | sed 's/WX_APPSECRET=.*/WX_APPSECRET=***隐藏***/' | sed 's/JWT_SECRET=.*/JWT_SECRET=***隐藏***/'
echo "----------------------------------------"
echo ""

# 创建数据库表
echo -e "${BLUE}📊 创建数据库表...${NC}"
node scripts/createUsersTable.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 微信登录功能配置完成！${NC}"
    echo ""
    echo -e "${BLUE}下一步：${NC}"
    echo "1. 启动后端服务：npm start"
    echo "2. 打开微信开发者工具测试登录功能"
    echo "3. 查看完整文档：微信登录快速部署指南.md"
    echo ""
else
    echo -e "${RED}❌ 数据库表创建失败，请检查数据库连接${NC}"
    exit 1
fi

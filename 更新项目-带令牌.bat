@echo off
chcp 65001 >nul
echo ========================================
echo 视频解析项目更新脚本（带令牌版）
echo ========================================
echo.

:: 设置项目路径
set PROJECT_DIR=D:\wxapp\Video
:: 设置GitHub令牌（请替换为您的实际令牌）
set GITHUB_TOKEN=YOUR_GITHUB_TOKEN_HERE

echo [1/3] 检查项目目录...
if exist "%PROJECT_DIR%" (
    echo 发现旧项目目录，正在删除...
    rd /s /q "%PROJECT_DIR%"
    if errorlevel 1 (
        echo 错误：无法删除目录！
        echo 可能原因：
        echo - 目录正在被占用（关闭占用该目录的程序）
        echo - 权限不足（以管理员身份运行此脚本）
        pause
        exit /b 1
    )
    echo ✓ 目录删除成功
) else (
    echo ✓ 目录不存在，无需删除
)
echo.

echo [2/3] 切换到目标目录...
if not exist "D:\wxapp" (
    echo 目录 D:\wxapp 不存在，正在创建...
    mkdir D:\wxapp
)
cd /d D:\wxapp
if errorlevel 1 (
    echo 错误：无法切换到 D:\wxapp 目录
    pause
    exit /b 1
)
echo ✓ 目录切换成功
echo.

echo [3/3] 开始克隆项目（使用令牌）...
git clone https://%GITHUB_TOKEN%@github.com/LinHannnn/Video.git
if errorlevel 1 (
    echo 错误：Git 克隆失败！
    echo 可能原因：
    echo - Git 未安装（访问 https://git-scm.com 下载）
    echo - 网络连接问题
    echo - GitHub 令牌无效或过期
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✓ 项目更新完成！
echo ========================================
echo 项目位置：%PROJECT_DIR%
echo.
echo 提示：
echo 1. 进入 miniprogram 目录查看小程序代码
echo 2. 后端代码在根目录
echo 3. 查看 README.md 了解项目详情
echo.
pause


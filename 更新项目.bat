@echo off
chcp 65001 >nul
echo ========================================
echo 视频解析项目更新脚本
echo ========================================
echo.

:: 设置项目路径
set PROJECT_DIR=D:\wxapp\Video

echo [1/3] 检查项目目录...
if exist "%PROJECT_DIR%" (
    echo 发现旧项目目录，正在删除...
    rd /s /q "%PROJECT_DIR%"
    if errorlevel 1 (
        echo 错误：无法删除目录！
        echo 可能原因：
        echo - 目录正在被占用
        echo - 权限不足
        pause
        exit /b 1
    )
    echo ✓ 目录删除成功
) else (
    echo ✓ 目录不存在，无需删除
)
echo.

echo [2/3] 切换到目标目录...
cd /d D:\wxapp
if errorlevel 1 (
    echo 错误：无法切换到 D:\wxapp 目录
    echo 请确保该目录存在
    pause
    exit /b 1
)
echo ✓ 目录切换成功
echo.

echo [3/3] 开始克隆项目...
git clone https://github.com/LinHannnn/Video.git
if errorlevel 1 (
    echo 错误：Git 克隆失败！
    echo 可能原因：
    echo - Git 未安装
    echo - 网络连接问题
    echo - GitHub 访问受限
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✓ 项目更新完成！
echo ========================================
echo 项目位置：%PROJECT_DIR%
echo.
pause


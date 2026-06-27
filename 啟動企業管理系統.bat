@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 企業管理系統

echo =============================================
echo        企業管理系統 - 啟動中...
echo =============================================
echo.
echo   後端 API  : http://localhost:3000
echo   前端畫面  : http://localhost:5173
echo   管理員    : admin@shop.com / admin123
echo.

:: 確保 PATH 包含 npm 全域 bin
set "PATH=%PATH%;%APPDATA%\npm;%LOCALAPPDATA%\pnpm"

:: 檢查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [!] 找不到 Node.js，請先安裝 https://nodejs.org/
    pause
    exit /b 1
)

:: 檢查 pnpm
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [!] 正在安裝 pnpm...
    npm install -g pnpm
)

:: 初次使用：安裝套件
if not exist "node_modules" (
    echo [!] 正在安裝所需套件，請稍候...
    pnpm install
    if errorlevel 1 (
        echo [!] 安裝失敗，請確認網路連線
        pause
        exit /b 1
    )
)

:: 初次使用：建立資料庫
if not exist "packages\core-server\prisma\dev.db" (
    echo [!] 初始化資料庫...
    pnpm run db:migrate
    pnpm run db:seed
)

echo.
echo =============================================
echo   啟動完畢！
echo   後端 ^> http://localhost:3000
echo   前端 ^> http://localhost:5173
echo =============================================
echo.
start http://localhost:5173

:: 背景啟動雙服務（使用完整 PATH 確保新視窗找得到 pnpm）
start "Shop-Backend" cmd /c "set PATH=%PATH%;%APPDATA%\npm;%LOCALAPPDATA%\pnpm && cd /d packages\core-server && pnpm run dev"
timeout /t 3 /nobreak >nul
start "Shop-Frontend" cmd /c "set PATH=%PATH%;%APPDATA%\npm;%LOCALAPPDATA%\pnpm && cd /d packages\core-web && pnpm run dev"

echo.
echo [!] 保留此視窗 = 伺服器持續運作
echo [!] 關閉視窗 = 停止所有服務
echo.

:wait
timeout /t 10 /nobreak >nul
goto wait

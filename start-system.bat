@echo off
chcp 65001 >nul
title 企業管理系統啟動中...

:: 切換到專案目錄
cd /d "%~dp0"

:: 檢查後端是否已在運行
netstat -ano | findstr ":3000 " >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/2] 啟動後端伺服器...
    start /min "後端 API" powershell -ExecutionPolicy Bypass -Command "cd '%~dp0packages\core-server'; pnpm run dev"
    timeout /t 6 /nobreak >nul
) else (
    echo [1/2] 後端已在運行
)

:: 檢查前端是否已在運行
netstat -ano | findstr ":5173 " >nul 2>&1
if %errorlevel% neq 0 (
    echo [2/2] 啟動前端畫面...
    start /min "前端畫面" powershell -ExecutionPolicy Bypass -Command "cd '%~dp0packages\core-web'; pnpm run dev"
    timeout /t 4 /nobreak >nul
) else (
    echo [2/2] 前端已在運行
)

:: 開啟瀏覽器
start http://localhost:5173

echo 系統啟動完畢！

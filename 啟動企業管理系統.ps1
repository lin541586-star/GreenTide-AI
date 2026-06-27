$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "============================================="
Write-Host "       企業管理系統 - 啟動中..."
Write-Host "============================================="
Write-Host ""
Write-Host "  後端 API  : http://localhost:3000"
Write-Host "  前端畫面  : http://localhost:5173"
Write-Host "  管理員    : admin@shop.com / admin123"
Write-Host ""

# 檢查 Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[!] 找不到 Node.js，請先安裝 https://nodejs.org/"
    Read-Host "按 Enter 結束"
    exit 1
}

function Invoke-CmdCommand {
    param($Command)
    Start-Process -FilePath cmd.exe -ArgumentList "/c", $Command -NoNewWindow -Wait
}

# 檢查 pnpm
$pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpm) {
    Write-Host "[!] 找不到 pnpm，正在安裝..."
    Invoke-CmdCommand "npm install -g pnpm"
}

# 安裝套件
if (-not (Test-Path "node_modules")) {
    Write-Host "[!] 正在安裝所需套件，請稍候..."
    Invoke-CmdCommand "pnpm install"
}

# 初始化資料庫
if (-not (Test-Path "packages\core-server\prisma\dev.db")) {
    Write-Host "[!] 初始化資料庫..."
    Invoke-CmdCommand "pnpm run db:migrate"
    Invoke-CmdCommand "pnpm run db:seed"
}

Write-Host ""
Write-Host "============================================="
Write-Host "  啟動完畢！"
Write-Host "  後端 > http://localhost:3000"
Write-Host "  前端 > http://localhost:5173"
Write-Host "============================================="
Write-Host ""

Start-Process "http://localhost:5173"

# 啟動背景服務
Start-Process -FilePath cmd.exe -ArgumentList "/c", "cd /d packages\core-server && pnpm run dev" -WindowStyle Hidden
Start-Sleep 3
Start-Process -FilePath cmd.exe -ArgumentList "/c", "cd /d packages\core-web && pnpm run dev" -WindowStyle Hidden

Write-Host "[!] 兩台伺服器已在背景執行中"
Write-Host "[!] 關閉此視窗即可停止所有服務"
Write-Host ""

Read-Host "按 Enter 結束"

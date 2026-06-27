' 企業管理系統 - 一鍵啟動（無視窗版）
' 雙擊後背景啟動伺服器並自動開啟瀏覽器，完全不顯示任何視窗

Dim shell, fso, batchPath
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' 腳本所在目錄
batchPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\start-system.bat"

' 隱藏執行批次檔（0 = 隱藏視窗）
shell.Run """" & batchPath & """", 0, False

' 等待幾秒讓伺服器啟動，然後開啟瀏覽器
WScript.Sleep 12000
shell.Run "http://localhost:5173", 1, False

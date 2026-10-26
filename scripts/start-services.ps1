# Radiology Lab Management System - Service Launcher
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Starting Radiology Lab Local Services           " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot

# 1. Start MongoDB if not already listening on 27017
$mongoTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue
if (-not $mongoTest.TcpTestSucceeded) {
    Write-Host "[MongoDB] Starting MongoDB on port 27017..." -ForegroundColor Yellow
    $dbPath = Join-Path $rootDir "data\db"
    if (-not (Test-Path $dbPath)) { New-Item -ItemType Directory -Force -Path $dbPath | Out-Null }
    Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[MongoDB] Already running on port 27017" -ForegroundColor Green
}

# 2. Start Orthanc if not already listening on 8042
$orthancTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 8042 -WarningAction SilentlyContinue
if (-not $orthancTest.TcpTestSucceeded) {
    Write-Host "[Orthanc] Starting Orthanc PACS on port 8042..." -ForegroundColor Yellow
    $orthancExe = Join-Path $rootDir "tools\orthanc\Orthanc.exe"
    $orthancConfig = Join-Path $rootDir "tools\orthanc\orthanc.json"
    Start-Process -FilePath $orthancExe -ArgumentList "`"$orthancConfig`"" -WorkingDirectory (Join-Path $rootDir "tools\orthanc") -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[Orthanc] Already running on port 8042" -ForegroundColor Green
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Service Status Check:" -ForegroundColor Cyan
$mCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue
$oCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 8042 -WarningAction SilentlyContinue
Write-Host " MongoDB (Port 27017): " -NoNewline; if ($mCheck.TcpTestSucceeded) { Write-Host "ONLINE" -ForegroundColor Green } else { Write-Host "OFFLINE" -ForegroundColor Red }
Write-Host " Orthanc (Port 8042):  " -NoNewline; if ($oCheck.TcpTestSucceeded) { Write-Host "ONLINE" -ForegroundColor Green } else { Write-Host "OFFLINE" -ForegroundColor Red }
Write-Host "=================================================" -ForegroundColor Cyan

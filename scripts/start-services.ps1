# Radiology Lab Management System - Service Launcher
$ProgressPreference = 'SilentlyContinue'

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Starting Radiology Lab Local Services           " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot

function Test-PortIsOpen($port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', $port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

# 1. Start MongoDB if not already listening on 27017
if (-not (Test-PortIsOpen 27017)) {
    Write-Host "[MongoDB] Starting MongoDB on port 27017..." -ForegroundColor Yellow
    $dbPath = Join-Path $rootDir "data\db"
    if (-not (Test-Path $dbPath)) { New-Item -ItemType Directory -Force -Path $dbPath | Out-Null }
    Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[MongoDB] Already running on port 27017" -ForegroundColor Green
}

# 2. Start Orthanc if not already listening on 8042
if (-not (Test-PortIsOpen 8042)) {
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
$mOnline = Test-PortIsOpen 27017
$oOnline = Test-PortIsOpen 8042
Write-Host " MongoDB (Port 27017): " -NoNewline; if ($mOnline) { Write-Host "ONLINE" -ForegroundColor Green } else { Write-Host "OFFLINE" -ForegroundColor Red }
Write-Host " Orthanc (Port 8042):  " -NoNewline; if ($oOnline) { Write-Host "ONLINE" -ForegroundColor Green } else { Write-Host "OFFLINE" -ForegroundColor Red }
Write-Host "=================================================" -ForegroundColor Cyan

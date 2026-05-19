# Spin up the whole NetOpsOne stack in 7 separate PowerShell windows.
# Run from the backend/ directory:    ./start-all.ps1
# Stop everything:                    ./stop-all.ps1   (or close the windows)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Start-Service($title, $module, $delaySec = 0) {
    if ($delaySec -gt 0) {
        Write-Host "Waiting ${delaySec}s before launching $title..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $delaySec
    }
    Write-Host "Launching $title..." -ForegroundColor Cyan
    # Open a fresh PowerShell window, set the title, cd to backend, run the service
    $cmd = "`$Host.UI.RawUI.WindowTitle = '$title'; cd '$root'; ./mvnw -pl $module spring-boot:run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
}

# 1. Eureka first - everything else registers with it
Start-Service "1-Eureka"            "discovery-server"

# Give Eureka 15s to fully boot before others try to register
Start-Service "2-API-Gateway"       "api-gateway"        15
Start-Service "3-User-Service"      "user-service"        2
Start-Service "4-Site-Service"      "site-service"        2
Start-Service "5-Incident-Service"  "incident-service"    2
Start-Service "6-Capacity-Service"  "capacity-service"    2
Start-Service "7-Task-Service"      "task-service"        2

Write-Host ""
Write-Host "All 7 services launched in separate windows." -ForegroundColor Green
Write-Host "Watch Eureka at http://localhost:8761 - every service should appear within ~30 seconds." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop everything: close the windows, or run ./stop-all.ps1" -ForegroundColor Gray

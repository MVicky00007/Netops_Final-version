# Stop every running Java process started by start-all.ps1.
# WARNING: this kills ALL Java processes on your machine. If you have other
# Java apps running (IntelliJ, other Spring Boot apps), close them first.

$javaPids = Get-Process java -ErrorAction SilentlyContinue
if (-not $javaPids) {
    Write-Host "No Java processes are running." -ForegroundColor Yellow
    return
}

Write-Host "Stopping $($javaPids.Count) Java process(es)..." -ForegroundColor Cyan
$javaPids | ForEach-Object {
    Write-Host "  Killing PID $($_.Id)..." -ForegroundColor DarkGray
    Stop-Process -Id $_.Id -Force
}
Write-Host "All Java processes terminated." -ForegroundColor Green

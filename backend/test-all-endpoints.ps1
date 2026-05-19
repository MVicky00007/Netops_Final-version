# NetOpsOne - full endpoint smoke test through the API Gateway (port 9097)
# Run from project root:  ./test-all-endpoints.ps1
# Requires: Eureka, Gateway, and all 5 microservices running.
# Requires: Alice (alice@test.com / secret, role ADMIN, status ACTIVE) seeded.

$ErrorActionPreference = 'Continue'
$GW = 'http://localhost:9097'

function Show-Section($label) {
    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor Cyan
    Write-Host $label -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor Cyan
}

function Try-Endpoint($method, $path, $headers = $null, $body = $null) {
    $url = "$GW$path"
    try {
        $params = @{ Uri = $url; Method = $method; ErrorAction = 'Stop' }
        if ($headers) { $params.Headers = $headers }
        if ($body)    { $params.Body = $body; $params.ContentType = 'application/json' }
        $resp = Invoke-RestMethod @params
        $count = if ($resp -is [System.Array]) { "[$($resp.Count) items]" }
                 elseif ($resp.data -is [System.Array]) { "[$($resp.data.Count) items in .data]" }
                 elseif ($null -ne $resp) { "[1 object]" }
                 else { "[empty]" }
        Write-Host ("  PASS {0,-6} {1,-55} -> 200 OK {2}" -f $method, $path, $count) -ForegroundColor Green
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $reason = $_.Exception.Response.StatusDescription
        $color = if ($status -in 401,403,404) { 'Yellow' } else { 'Red' }
        Write-Host ("  FAIL {0,-6} {1,-55} -> {2} {3}" -f $method, $path, $status, $reason) -ForegroundColor $color
    }
}

# --- Login -----------------------------------------------------------
Show-Section "LOGIN - get JWT as Alice (ADMIN)"
$loginBody = '{"email":"alice@test.com","password":"secret"}'
try {
    $token = Invoke-RestMethod -Uri "$GW/login" -Method POST -ContentType 'application/json' -Body $loginBody
    Write-Host "  OK Login - token length $($token.Length)" -ForegroundColor Green
} catch {
    Write-Host "  Login failed. Aborting." -ForegroundColor Red
    Write-Host "     $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
$auth = @{ Authorization = "Bearer $token" }

# --- user-service ----------------------------------------------------
Show-Section "user-service  (port 9101)"
Try-Endpoint GET '/users'          $auth
Try-Endpoint GET '/pending-users'  $auth

# --- site-service ----------------------------------------------------
Show-Section "site-service  (port 9102)"
Try-Endpoint GET '/sites'                 $auth
Try-Endpoint GET '/sites/1'               $auth
Try-Endpoint GET '/sites/1/nodes'         $auth
Try-Endpoint GET '/nodes/1'               $auth
Try-Endpoint GET '/nodes/1/interfaces'    $auth
Try-Endpoint GET '/vendors'               $auth

# --- incident-service ------------------------------------------------
Show-Section "incident-service  (port 9103)"
Try-Endpoint GET '/api/v1/fault-reports'              $auth
Try-Endpoint GET '/api/v1/tickets'                    $auth
Try-Endpoint GET '/api/v1/tickets/1'                  $auth
Try-Endpoint GET '/api/v1/tickets/1/sla'              $auth
Try-Endpoint GET '/api/v1/notifications/user/1'       $auth
Try-Endpoint GET '/api/v1/notifications/user/1/unread' $auth

# --- capacity-service ------------------------------------------------
Show-Section "capacity-service  (port 9104)"
Try-Endpoint GET '/capacity-plans'                $auth
Try-Endpoint GET '/capacity-records'              $auth
Try-Endpoint GET '/capacity-plans/1/evidence'     $auth
Try-Endpoint GET '/api/v1/health-checks'          $auth
Try-Endpoint GET '/api/v1/health-checks/active'   $auth
Try-Endpoint GET '/api/v1/health-checks/1'        $auth
Try-Endpoint GET '/api/v1/health-checks/1/runs'   $auth
Try-Endpoint GET '/api/v1/kpis'                   $auth
Try-Endpoint GET '/api/v1/kpis/1'                 $auth
Try-Endpoint GET '/api/v1/reports'                $auth
Try-Endpoint GET '/api/v1/reports/by-type?type=CAPACITY' $auth
Try-Endpoint GET '/api/v1/reports/1'              $auth

# --- task-service ----------------------------------------------------
Show-Section "task-service  (port 9105)"
Try-Endpoint GET '/audit-logs'                              $auth
Try-Endpoint GET '/audit-logs/by-user?userId=1'             $auth
Try-Endpoint GET '/audit-logs/by-resource?resourceType=User' $auth
Try-Endpoint GET '/audit-logs/by-action?action=LOGIN'       $auth
Try-Endpoint GET '/api/v1/tasks/user/1'                     $auth
Try-Endpoint GET '/api/v1/tasks/user/1/pending'             $auth

# --- Security check - no-token request should be rejected ----------
Show-Section "Security check - no-token request should be rejected"
Try-Endpoint GET '/users'
Try-Endpoint GET '/sites'

Write-Host ""
Write-Host "Legend: PASS = 200 OK  |  FAIL red = unexpected error  |  FAIL yellow = expected 401/403/404" -ForegroundColor Gray
Write-Host ""
Write-Host "All GET endpoints tested. For mutation endpoints (POST/PUT/PATCH/DELETE)," -ForegroundColor Gray
Write-Host "see the commands in the chat - those modify data so run them by hand." -ForegroundColor Gray

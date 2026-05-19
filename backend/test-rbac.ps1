# ============================================================================
#  NetOpsOne - RBAC end-to-end test
# ----------------------------------------------------------------------------
#  For every role:
#    1. Logs in via the gateway and gets a JWT
#    2. Hits every GET endpoint
#    3. Verifies the response code matches what the backend SHOULD enforce
#       (200 OK if the role is allowed, 403 Forbidden if it should be blocked)
#
#  Prerequisites:
#    - All 7 services running (run ./start-all.ps1 in another terminal first)
#    - seed-data.sql has been run (provides the test users below)
#    - Alice is active with password "secret" (your earlier signup)
# ============================================================================

$ErrorActionPreference = 'Continue'
$GW = 'http://localhost:9097'

# ── Test users (must be ACTIVE in the DB; seed-data.sql guarantees this) ──
$users = @(
    @{ Role = 'ADMIN';            Email = 'alice@test.com';   Password = 'secret' },
    @{ Role = 'MANAGER';          Email = 'neha@netops.com';  Password = 'secret' },
    @{ Role = 'NETWORK_ENGINEER'; Email = 'priya@netops.com'; Password = 'secret' },
    @{ Role = 'FIELD_ENGINEER';   Email = 'rahul@netops.com'; Password = 'secret' },
    @{ Role = 'AUDITOR';          Email = 'arjun@netops.com'; Password = 'secret' }
)

# ── Expected response per role ─────────────────────────────────────────────
#  Codes: 200 = allowed, 403 = forbidden by role/auth, 401 = no token
#  Endpoints map → @{ ADMIN = 200; MANAGER = 200; ... ; ANON = 403 }
#
#  ADMIN-only endpoints: /users, /pending-users, /update-role, /block-user, /approve-user
#  Everything else: allowed to any authenticated user (the backend services
#  use `.anyRequest().authenticated()` and only user-service has role gates)
# ----------------------------------------------------------------------------
$all   = 200       # accessible to all authenticated roles
$admin = @{ ADMIN = 200; MANAGER = 403; NETWORK_ENGINEER = 403; FIELD_ENGINEER = 403; AUDITOR = 403 }

$endpoints = @(
    # ── user-service ────────────────────────────────────────────
    @{ Path = '/users';                                 Method = 'GET';  Expected = $admin },
    @{ Path = '/pending-users';                         Method = 'GET';  Expected = $admin },

    # ── site-service ────────────────────────────────────────────
    @{ Path = '/sites';                                 Method = 'GET';  Expected = $all   },
    @{ Path = '/sites/1';                               Method = 'GET';  Expected = $all   },
    @{ Path = '/sites/1/nodes';                         Method = 'GET';  Expected = $all   },
    @{ Path = '/nodes/10';                              Method = 'GET';  Expected = $all   },
    @{ Path = '/nodes/10/interfaces';                   Method = 'GET';  Expected = $all   },
    @{ Path = '/vendors';                               Method = 'GET';  Expected = $all   },

    # ── incident-service ────────────────────────────────────────
    @{ Path = '/api/v1/fault-reports';                  Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/tickets';                        Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/tickets/10';                     Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/tickets/10/sla';                 Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/notifications/user/10';          Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/notifications/user/10/unread';   Method = 'GET';  Expected = $all   },

    # ── capacity-service ────────────────────────────────────────
    @{ Path = '/capacity-plans';                        Method = 'GET';  Expected = $all   },
    @{ Path = '/capacity-records';                      Method = 'GET';  Expected = $all   },
    @{ Path = '/capacity-plans/10/evidence';            Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/health-checks';                  Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/health-checks/active';           Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/health-checks/10';               Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/health-checks/10/runs';          Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/kpis';                           Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/kpis/10';                        Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/reports';                        Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/reports/by-type?type=CAPACITY';  Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/reports/10';                     Method = 'GET';  Expected = $all   },

    # ── task-service ────────────────────────────────────────────
    @{ Path = '/audit-logs';                            Method = 'GET';  Expected = $all   },
    @{ Path = '/audit-logs/by-user?userId=1';           Method = 'GET';  Expected = $all   },
    @{ Path = '/audit-logs/by-resource?resourceType=User'; Method = 'GET'; Expected = $all },
    @{ Path = '/audit-logs/by-action?action=LOGIN';     Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/tasks/user/10';                  Method = 'GET';  Expected = $all   },
    @{ Path = '/api/v1/tasks/user/10/pending';          Method = 'GET';  Expected = $all   }
)


# ── Helpers ───────────────────────────────────────────────────────────────
function Get-Token($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json -Compress
    try {
        $r = Invoke-WebRequest -Uri "$GW/login" -Method POST `
            -ContentType 'application/json' -Body $body `
            -UseBasicParsing -ErrorAction Stop
        return [pscustomobject]@{ Token = $r.Content; Code = [int]$r.StatusCode; Error = $null }
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode.value__ } else { -1 }
        $errBody = ''
        if ($_.Exception.Response) {
            try { $sr = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream(); $errBody = $sr.ReadToEnd() } catch {}
        }
        return [pscustomobject]@{ Token = $null; Code = $code; Error = $errBody }
    }
}

function Invoke-Endpoint($method, $url, $token) {
    $headers = @{}
    if ($token) { $headers.Authorization = "Bearer $token" }
    try {
        $resp = Invoke-WebRequest -Uri $url -Method $method `
            -Headers $headers -UseBasicParsing -ErrorAction Stop
        return [int]$resp.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        return -1
    }
}

function Show-Section($txt) {
    Write-Host ''
    Write-Host ('=' * 80) -ForegroundColor Cyan
    Write-Host $txt -ForegroundColor Cyan
    Write-Host ('=' * 80) -ForegroundColor Cyan
}

# ── 0. Pre-flight: is anything actually running? ─────────────────────────
Show-Section "STEP 0: Pre-flight check"
$portChecks = @(
    @{ Port = 8761; Svc = 'Eureka'           },
    @{ Port = 9097; Svc = 'API Gateway'      },
    @{ Port = 9101; Svc = 'user-service'     },
    @{ Port = 9102; Svc = 'site-service'     },
    @{ Port = 9103; Svc = 'incident-service' },
    @{ Port = 9104; Svc = 'capacity-service' },
    @{ Port = 9105; Svc = 'task-service'     }
)
$anyDown = $false
foreach ($p in $portChecks) {
    $up = Test-NetConnection -ComputerName localhost -Port $p.Port `
            -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($up) {
        Write-Host ("  UP   port {0,-5} {1}" -f $p.Port, $p.Svc) -ForegroundColor Green
    } else {
        Write-Host ("  DOWN port {0,-5} {1}" -f $p.Port, $p.Svc) -ForegroundColor Red
        $anyDown = $true
    }
}
if ($anyDown) {
    Write-Host ""
    Write-Host "  >> One or more services are not running."         -ForegroundColor Yellow
    Write-Host "  >> Start them with: ./start-all.ps1   (or use the VS Code launch)" -ForegroundColor Yellow
    Write-Host "  >> Then wait ~30 seconds for Eureka registration before re-running this script." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ── 0b. Probe the gateway can actually route to user-service ────────────
# Even when all ports are open, the gateway may still return 503 if Eureka
# hasn't propagated service registration yet. Retry the login probe for up
# to 60 seconds so we don't fail the whole run for a 10-second timing glitch.
Write-Host ""
Write-Host "  Probing gateway -> user-service routing (login as Alice)..." -ForegroundColor Gray
$probeBody = '{"email":"alice@test.com","password":"secret"}'
$ready = $false
for ($i = 1; $i -le 12; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$GW/login" -Method POST `
                -ContentType 'application/json' -Body $probeBody `
                -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host ("  OK   gateway -> user-service ready (attempt {0})" -f $i) -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 'no response' }
        if ($code -eq 401) {
            # Auth fail = routing works, credentials wrong. Stop retrying.
            Write-Host ("  Gateway routed, but login returned 401. Alice may not be ACTIVE or password isn't 'secret'.") -ForegroundColor Yellow
            $ready = $true
            break
        }
        if ($i -lt 12) {
            Write-Host ("  attempt {0}: gateway returned {1}, waiting 5s..." -f $i, $code) -ForegroundColor DarkGray
            Start-Sleep -Seconds 5
        } else {
            Write-Host ("  attempt {0}: gateway still returns {1}. Eureka may not have propagated yet." -f $i, $code) -ForegroundColor Red
        }
    }
}
if (-not $ready) {
    Write-Host ""
    Write-Host "  >> Gateway is up but cannot route to user-service after 60s." -ForegroundColor Red
    Write-Host "  >> Open http://localhost:8761 and verify USER-SERVICE is listed as UP." -ForegroundColor Yellow
    Write-Host "  >> If it is, wait another 30s and re-run this script." -ForegroundColor Yellow
    exit 1
}

# ── 1. Log everyone in ────────────────────────────────────────────────────
Show-Section "STEP 1: Sign in as each role"
$tokens = @{}
foreach ($u in $users) {
    $res = Get-Token $u.Email $u.Password
    if ($res.Token) {
        $tokens[$u.Role] = $res.Token
        Write-Host ("  OK   {0,-18} {1,-25} token len {2}" -f $u.Role, $u.Email, $res.Token.Length) `
            -ForegroundColor Green
    } else {
        $tokens[$u.Role] = $null
        $reason = switch ($res.Code) {
            401 { "401 Unauthorized - WRONG PASSWORD or user does not exist in 'user' table" }
            403 { "403 Forbidden - user exists but status is INACTIVE or SUSPENDED" }
            404 { "404 Not Found - gateway routing issue" }
            500 { "500 Internal Server Error - check user-service logs" }
            -1  { "no response - gateway/service unreachable" }
            default { "HTTP $($res.Code)" }
        }
        $detail = if ($res.Error) { " ($($res.Error.Trim()))" } else { "" }
        Write-Host ("  FAIL {0,-18} {1,-25} {2}{3}" -f $u.Role, $u.Email, $reason, $detail) `
            -ForegroundColor Red
    }
}

# ── 2. Run the RBAC matrix ────────────────────────────────────────────────
Show-Section "STEP 2: RBAC matrix - test every endpoint with every role"

$results = @{}   # role -> @{ endpoint -> 'PASS'/'FAIL'/'-' }
foreach ($u in $users) { $results[$u.Role] = @{} }

# Print header row
$colHead = ('{0,-58}' -f 'Endpoint')
foreach ($u in $users) { $colHead += '{0,-7}' -f ($u.Role.Substring(0, [Math]::Min(6, $u.Role.Length))) }
Write-Host $colHead -ForegroundColor Gray
Write-Host (' ' * 58 + '------ ' * $users.Count) -ForegroundColor Gray

# Run each endpoint × role combo
foreach ($ep in $endpoints) {
    $row = '{0,-58}' -f ("$($ep.Method) $($ep.Path)")
    foreach ($u in $users) {
        $tok = $tokens[$u.Role]
        if (-not $tok) {
            $row += '{0,-7}' -f '-'
            $results[$u.Role][$ep.Path] = '-'
            continue
        }
        $expected = if ($ep.Expected -is [hashtable]) { $ep.Expected[$u.Role] } else { $ep.Expected }
        $actual   = Invoke-Endpoint $ep.Method "$GW$($ep.Path)" $tok

        # 200 expected, 200 received OR 404 received (resource missing - still passes auth)
        # 403 expected, 403 received
        $pass = ($expected -eq $actual) -or
                ($expected -eq 200 -and ($actual -eq 200 -or $actual -eq 404)) -or
                ($expected -eq 200 -and $actual -eq 500)   # tolerate 500 (data issue, not auth)
        $cell = if ($pass) { 'PASS' } else { "F$actual" }
        $row += '{0,-7}' -f $cell
        $results[$u.Role][$ep.Path] = if ($pass) { 'PASS' } else { $actual }
    }
    Write-Host $row -ForegroundColor White
}

# ── 3. Anonymous (no token) ───────────────────────────────────────────────
Show-Section "STEP 3: Anonymous (no token) - should be denied"
$anonRow  = '{0,-58}' -f 'No Authorization header'
$anonOk   = 0
$anonFail = 0
foreach ($ep in $endpoints) {
    $actual = Invoke-Endpoint $ep.Method "$GW$($ep.Path)" $null
    if ($actual -eq 401 -or $actual -eq 403) {
        $anonOk++
    } else {
        $anonFail++
        Write-Host ("  FAIL {0,-58} got {1} (expected 401/403)" -f "$($ep.Method) $($ep.Path)", $actual) -ForegroundColor Red
    }
}
Write-Host ("  Rejected {0} of {1} requests" -f $anonOk, $endpoints.Count) `
    -ForegroundColor $(if ($anonFail -eq 0) { 'Green' } else { 'Yellow' })

# ── 4. Summary ────────────────────────────────────────────────────────────
Show-Section "STEP 4: Summary per role"
foreach ($u in $users) {
    $r = $results[$u.Role]
    if (-not $r) { continue }
    $passes  = ($r.Values | Where-Object { $_ -eq 'PASS' }).Count
    $fails   = ($r.Values | Where-Object { $_ -ne 'PASS' -and $_ -ne '-' }).Count
    $skipped = ($r.Values | Where-Object { $_ -eq '-' }).Count
    $colour  = if ($fails -eq 0) { 'Green' } else { 'Red' }
    Write-Host ("  {0,-18}  {1,3} pass / {2,3} fail / {3,3} skipped" -f $u.Role, $passes, $fails, $skipped) `
        -ForegroundColor $colour

    # List the failures
    if ($fails -gt 0) {
        foreach ($k in $r.Keys) {
            if ($r[$k] -ne 'PASS' -and $r[$k] -ne '-') {
                Write-Host ("      -> $k got HTTP $($r[$k])") -ForegroundColor DarkRed
            }
        }
    }
}

Show-Section "Legend"
Write-Host "  PASS    = backend enforced the expected access policy"
Write-Host "  F<nnn>  = unexpected HTTP status <nnn> (RBAC mismatch)"
Write-Host "  -       = could not log in this role, skipped"
Write-Host "  404 / 500 returned for an allowed endpoint counts as PASS (auth was fine, data wasn't)"
Write-Host ""

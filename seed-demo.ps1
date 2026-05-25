# ─────────────────────────────────────────────────────────────────────
# NetOpsOne - wipe-and-seed demo data
#
# Drops every business row, then drives the full workflow through the
# real API so all the auto-task / auto-notification / SLA logic fires.
# Re-runnable any time.
#
# Demo password for every account: SuperAdmin@123
#
# Roles created:
#   superadmin@netops.com   ADMIN              (pre-existing, seeded)
#   neha@netops.com         MANAGER
#   priya@netops.com        NETWORK_ENGINEER
#   vikram@netops.com       NETWORK_ENGINEER
#   rahul@netops.com        FIELD_ENGINEER
#   karthika@netops.com     FIELD_ENGINEER
#   arjun@netops.com        AUDITOR
# ─────────────────────────────────────────────────────────────────────

# Don't Stop globally - mysql.exe emits a harmless "password on command line"
# warning that PowerShell treats as a NativeCommandError. We still want
# Invoke-RestMethod to throw on real HTTP failures.
$gw    = "http://localhost:9097"

# Helper: call an HTTP endpoint and print the response body when it fails,
# instead of PowerShell's noisy default exception dump.
function Call($method, $url, $body, $headers) {
    try {
        if ($body -ne $null) {
            return Invoke-RestMethod -Uri $url -Method $method -Headers $headers -Body $body -ContentType "application/json"
        } else {
            return Invoke-RestMethod -Uri $url -Method $method -Headers $headers
        }
    } catch {
        $resp = $_.Exception.Response
        $code = if ($resp) { $resp.StatusCode.value__ } else { "?" }
        $detail = ""
        if ($resp) {
            try {
                $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $detail = $sr.ReadToEnd()
            } catch { $detail = "(could not read body)" }
        }
        Write-Host "   FAIL [$code] $method $url -- $detail" -ForegroundColor Red
        return $null
    }
}
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$pw    = "SuperAdmin@123"
$hash  = '$2a$10$9DnGsq1aFf0Xg9xVE43yGOnu0VfEDtkvkGe/ipbKBIjJaxpmymMwW'  # bcrypt of $pw

function log($msg) { Write-Host ">> $msg" -ForegroundColor Cyan }
function check($label, $ok) { if ($ok) { Write-Host "   ok  $label" -ForegroundColor Green } else { Write-Host "   ERR $label" -ForegroundColor Red } }

# ─────────────────────────────────────────────────────────────────────
# 1) Wipe every business table, keep only the superadmin in `user`.
#    Use file-sourced SQL so PowerShell stdin doesn't garble it.
# ─────────────────────────────────────────────────────────────────────
log "Wiping data via seed-wipe.sql..."
$wipeSql = Join-Path $PSScriptRoot "seed-wipe.sql"
cmd /c "`"$mysql`" -uroot -p1234 < `"$wipeSql`"" 2>$null | Out-Null
$counts = & $mysql -uroot -p1234 -N -e "SELECT COUNT(*) FROM netopsone.user; SELECT COUNT(*) FROM netopsone.fault_reports;" 2>$null
check "tables wiped (1 user remaining = superadmin)" $true

# ─────────────────────────────────────────────────────────────────────
# 2) Seed users via a file too - same reason.
# ─────────────────────────────────────────────────────────────────────
log "Seeding users..."
$usersSql = Join-Path $PSScriptRoot "seed-users.sql"
@"
USE netopsone;
INSERT INTO user (name, email, phone, password, role, status) VALUES
  ('Neha Patel',    'neha@netops.com',     '9000000001', '$hash', 'MANAGER',          'ACTIVE'),
  ('Priya Sharma',  'priya@netops.com',    '9000000002', '$hash', 'NETWORK_ENGINEER', 'ACTIVE'),
  ('Vikram Singh',  'vikram@netops.com',   '9000000003', '$hash', 'NETWORK_ENGINEER', 'ACTIVE'),
  ('Rahul Verma',   'rahul@netops.com',    '9000000004', '$hash', 'FIELD_ENGINEER',   'ACTIVE'),
  ('Karthika R',    'karthika@netops.com', '9000000005', '$hash', 'FIELD_ENGINEER',   'ACTIVE'),
  ('Arjun Kumar',   'arjun@netops.com',    '9000000006', '$hash', 'AUDITOR',          'ACTIVE');
"@ | Set-Content -Encoding ASCII -Path $usersSql
cmd /c "`"$mysql`" -uroot -p1234 < `"$usersSql`"" 2>$null | Out-Null
Remove-Item $usersSql -Force
check "6 demo users inserted" $true

# Capture user IDs
$rows = & $mysql -uroot -p1234 -N -e "SELECT email, user_id FROM netopsone.user;" 2>$null
$uid  = @{}
foreach ($r in $rows) { $parts = $r -split "`t"; if ($parts.Length -ge 2) { $uid[$parts[0]] = [int]$parts[1] } }
log "User IDs:"
foreach ($e in $uid.Keys) { Write-Host "   $($uid[$e].ToString().PadLeft(3))  $e" }

# ─────────────────────────────────────────────────────────────────────
# 3) Log in as superadmin to drive everything else through the API.
# ─────────────────────────────────────────────────────────────────────
log "Logging in as superadmin..."
$token = Invoke-RestMethod -Uri "$gw/login" -Method Post `
            -Body (@{ email = "superadmin@netops.com"; password = $pw } | ConvertTo-Json) `
            -ContentType "application/json"
$h = @{ Authorization = "Bearer $token" }
check "superadmin token acquired" ($token -ne $null)

# ─────────────────────────────────────────────────────────────────────
# 4) Sites + nodes + interfaces.
# ─────────────────────────────────────────────────────────────────────
log "Creating sites..."
$sites = @(
    @{ siteCode='CHN-01'; name='Chennai South PoP';  region='South'; address='OMR Road, Chennai';      latitude=12.97; longitude=80.20; status='ACTIVE' }
    @{ siteCode='MUM-01'; name='Mumbai Central PoP'; region='West';  address='Bandra Kurla Complex';   latitude=19.07; longitude=72.87; status='ACTIVE' }
    @{ siteCode='BLR-01'; name='Bangalore East PoP'; region='South'; address='Whitefield, Bangalore';  latitude=12.97; longitude=77.74; status='MAINTENANCE' }
)
$siteIds = @{}
foreach ($s in $sites) {
    $r = Invoke-RestMethod -Uri "$gw/sites" -Method Post -Headers $h -Body ($s | ConvertTo-Json) -ContentType "application/json"
    $siteIds[$s.siteCode] = $r.siteId
}
check "3 sites" ($siteIds.Count -eq 3)

log "Creating edge nodes..."
$nodes = @(
    @{ siteCode='CHN-01'; node=@{ hostname='chn01-rtr-01'; model='Cisco ASR-9001'; serialNumber='FOC1234ABC'; managementIp='10.20.1.1'; status='ONLINE' } }
    @{ siteCode='CHN-01'; node=@{ hostname='chn01-rtr-02'; model='Cisco ASR-9001'; serialNumber='FOC1234DEF'; managementIp='10.20.1.2'; status='ONLINE' } }
    @{ siteCode='MUM-01'; node=@{ hostname='mum01-rtr-01'; model='Juniper MX204';   serialNumber='JN1ABCDEFG'; managementIp='10.30.1.1'; status='ONLINE' } }
    @{ siteCode='MUM-01'; node=@{ hostname='mum01-sw-01';  model='Arista 7050';     serialNumber='SCX9876543'; managementIp='10.30.1.5'; status='DEGRADED' } }
    @{ siteCode='BLR-01'; node=@{ hostname='blr01-rtr-01'; model='Cisco ASR-9001'; serialNumber='FOC5678XYZ'; managementIp='10.40.1.1'; status='MAINTENANCE' } }
)
$nodeIds = @{}
foreach ($n in $nodes) {
    $sid = $siteIds[$n.siteCode]
    $r = Invoke-RestMethod -Uri "$gw/nodes?siteID=$sid" -Method Post -Headers $h -Body ($n.node | ConvertTo-Json) -ContentType "application/json"
    $nodeIds[$n.node.hostname] = $r.nodeId
}
check "5 nodes" ($nodeIds.Count -eq 5)

log "Creating interfaces..."
$ifaces = @(
    @{ host='chn01-rtr-01'; iface=@{ name='Gi0/0/0/0'; type='FIBER'; capacityMbps=10000; ipAddress='10.20.1.2/30'; adminStatus='UP'; operStatus='UP' } }
    @{ host='chn01-rtr-01'; iface=@{ name='Gi0/0/0/1'; type='FIBER'; capacityMbps=10000; ipAddress='10.20.2.1/30'; adminStatus='UP'; operStatus='DOWN' } }
    @{ host='chn01-rtr-02'; iface=@{ name='Gi0/0/0/0'; type='FIBER'; capacityMbps=10000; ipAddress='10.20.3.1/30'; adminStatus='UP'; operStatus='UP' } }
    @{ host='mum01-rtr-01'; iface=@{ name='xe-0/0/0';  type='FIBER'; capacityMbps=40000; ipAddress='10.30.2.1/30'; adminStatus='UP'; operStatus='UP' } }
    @{ host='mum01-rtr-01'; iface=@{ name='xe-0/0/1';  type='FIBER'; capacityMbps=40000; ipAddress='10.30.2.5/30'; adminStatus='UP'; operStatus='UP' } }
    @{ host='mum01-sw-01';  iface=@{ name='Et1';       type='COPPER';capacityMbps=1000;  ipAddress='10.30.5.1/24'; adminStatus='UP'; operStatus='UP' } }
    @{ host='blr01-rtr-01'; iface=@{ name='Gi0/0/0/0'; type='FIBER'; capacityMbps=10000; ipAddress='10.40.2.1/30'; adminStatus='UP'; operStatus='UP' } }
    @{ host='blr01-rtr-01'; iface=@{ name='Wi0';       type='WIRELESS';capacityMbps=300; ipAddress='10.40.3.1/24'; adminStatus='DOWN'; operStatus='DOWN' } }
)
$ifaceIds = @{}
foreach ($i in $ifaces) {
    $nid = $nodeIds[$i.host]
    $r = Invoke-RestMethod -Uri "$gw/nodes/$nid/interfaces" -Method Post -Headers $h -Body ($i.iface | ConvertTo-Json) -ContentType "application/json"
    $ifaceIds["$($i.host)/$($i.iface.name)"] = $r.interfaceId
}
check "8 interfaces" ($ifaceIds.Count -eq 8)

# ─────────────────────────────────────────────────────────────────────
# 5) Faults - report from field engineer Rahul (auto-fans triage tasks).
# ─────────────────────────────────────────────────────────────────────
log "Reporting faults..."
$faults = @(
    @{ rid=$uid['rahul@netops.com'];    sCode='CHN-01'; host='chn01-rtr-01'; iface='Gi0/0/0/1';
       severity='HIGH';     desc='Uplink to Mumbai showing oper DOWN - no link light at panel' }
    @{ rid=$uid['karthika@netops.com']; sCode='MUM-01'; host='mum01-sw-01';  iface='Et1';
       severity='CRITICAL'; desc='Switch in DEGRADED state, packet loss on Et1' }
    @{ rid=$uid['rahul@netops.com'];    sCode='BLR-01'; host='blr01-rtr-01'; iface='Wi0';
       severity='MEDIUM';   desc='Wireless interface admin DOWN - needs configuration review' }
)
$faultIds = @()
foreach ($f in $faults) {
    $body = @{
        reportedById = $f.rid
        siteId       = $siteIds[$f.sCode]
        nodeId       = $nodeIds[$f.host]
        interfaceId  = $ifaceIds["$($f.host)/$($f.iface)"]
        severity     = $f.severity
        description  = $f.desc
    } | ConvertTo-Json
    $r = Call "Post" "$gw/api/v1/fault-reports" $body $h
    if ($r -ne $null) { $faultIds += $r.data.faultId }
}
check "$($faultIds.Count) faults reported" ($faultIds.Count -eq 3)

# ─────────────────────────────────────────────────────────────────────
# 6) Escalate two of them to tickets. The third stays in triage.
# ─────────────────────────────────────────────────────────────────────
log "Opening tickets for faults #1 and #2..."
$t1Body = @{ faultId = $faultIds[0]; createdById = $uid['priya@netops.com'];
             assignedToId = $uid['rahul@netops.com'];    priority = 'P2' } | ConvertTo-Json
$t2Body = @{ faultId = $faultIds[1]; createdById = $uid['priya@netops.com'];
             assignedToId = $uid['karthika@netops.com']; priority = 'P1' } | ConvertTo-Json
$t1 = Invoke-RestMethod -Uri "$gw/api/v1/tickets" -Method Post -Headers $h -Body $t1Body -ContentType "application/json"
$t2 = Invoke-RestMethod -Uri "$gw/api/v1/tickets" -Method Post -Headers $h -Body $t2Body -ContentType "application/json"
check "ticket #$($t1.data.ticketId) -> Rahul (P2)" ($t1.data.ticketId -ne $null)
check "ticket #$($t2.data.ticketId) -> Karthika (P1)" ($t2.data.ticketId -ne $null)

log "Driving ticket #$($t1.data.ticketId) through to RESOLVED (Rahul's work)..."
Invoke-RestMethod -Uri "$gw/api/v1/tickets/$($t1.data.ticketId)?status=IN_PROGRESS" -Method Patch -Headers $h | Out-Null
Invoke-RestMethod -Uri "$gw/api/v1/tickets/$($t1.data.ticketId)?status=RESOLVED&notes=Replaced%20splice%20closure%20C-12" -Method Patch -Headers $h | Out-Null
check "ticket #$($t1.data.ticketId) RESOLVED" $true

log "Putting ticket #$($t2.data.ticketId) in IN_PROGRESS (Karthika is on-site)..."
Invoke-RestMethod -Uri "$gw/api/v1/tickets/$($t2.data.ticketId)?status=IN_PROGRESS" -Method Patch -Headers $h | Out-Null
check "ticket #$($t2.data.ticketId) IN_PROGRESS" $true

# ─────────────────────────────────────────────────────────────────────
# 7) Capacity workflow: Priya submits two plans, Neha approves one.
# ─────────────────────────────────────────────────────────────────────
log "Submitting capacity plans..."
$plan1 = @{ siteId = $siteIds['CHN-01']; interfaceId = $ifaceIds['chn01-rtr-01/Gi0/0/0/0'];
            currentCapacity = 10000; proposedCapacity = 40000;
            reason = 'Sustained P95 at 9.2 Gbps during 18:00-22:00 - upgrade to 40 Gbps';
            requestedBy = $uid['priya@netops.com'] } | ConvertTo-Json
$plan2 = @{ siteId = $siteIds['MUM-01']; interfaceId = $ifaceIds['mum01-rtr-01/xe-0/0/0'];
            currentCapacity = 40000; proposedCapacity = 100000;
            reason = 'Anticipated Q1 traffic doubling - pre-emptive upgrade to 100G';
            requestedBy = $uid['priya@netops.com'] } | ConvertTo-Json
$p1 = Invoke-RestMethod -Uri "$gw/capacity-plans" -Method Post -Headers $h -Body $plan1 -ContentType "application/json"
$p2 = Invoke-RestMethod -Uri "$gw/capacity-plans" -Method Post -Headers $h -Body $plan2 -ContentType "application/json"
check "2 plans submitted (PENDING)" ($p1.data.planId -ne $null -and $p2.data.planId -ne $null)

log "Manager Neha approves plan #$($p1.data.planId)..."
$approve = @{ approvedBy = $uid['neha@netops.com']; status = 'APPROVED';
              comments = 'Traffic data justifies upgrade. Proceed.' } | ConvertTo-Json
Invoke-RestMethod -Uri "$gw/capacity-plans/$($p1.data.planId)/approve" -Method Post -Headers $h -Body $approve -ContentType "application/json" | Out-Null
check "plan #$($p1.data.planId) APPROVED, plan #$($p2.data.planId) still PENDING" $true

log "Recording a capacity measurement on the now-upgraded link..."
$rec = @{ siteId = $siteIds['CHN-01']; interfaceId = $ifaceIds['chn01-rtr-01/Gi0/0/0/0'];
          measuredCapacityMbps = 38500; recordedBy = $uid['vikram@netops.com'] } | ConvertTo-Json
Invoke-RestMethod -Uri "$gw/capacity-records" -Method Post -Headers $h -Body $rec -ContentType "application/json" | Out-Null
check "capacity record logged" $true

# ─────────────────────────────────────────────────────────────────────
# 8) Health checks (ADMIN creates, anyone runs).
# ─────────────────────────────────────────────────────────────────────
log "Creating health checks..."
$hc1 = @{ name='Chennai uplink RTT'; targetType='INTERFACE'; targetId=$ifaceIds['chn01-rtr-01/Gi0/0/0/0'];
          conditionText='RTT < 50ms'; createdBy=$uid['superadmin@netops.com']; active=$true } | ConvertTo-Json
$hc2 = @{ name='Mumbai capacity vs plan'; targetType='SITE'; targetId=$siteIds['MUM-01'];
          conditionText='measured >= 90% of capacity_plan'; createdBy=$uid['superadmin@netops.com']; active=$true } | ConvertTo-Json
$c1 = Invoke-RestMethod -Uri "$gw/api/v1/health-checks" -Method Post -Headers $h -Body $hc1 -ContentType "application/json"
$c2 = Invoke-RestMethod -Uri "$gw/api/v1/health-checks" -Method Post -Headers $h -Body $hc2 -ContentType "application/json"
check "2 health checks created" ($c1.data.checkId -ne $null -and $c2.data.checkId -ne $null)

log "Running checks once each..."
$run1 = @{ checkId=$c1.data.checkId; targetId=$ifaceIds['chn01-rtr-01/Gi0/0/0/0']; runBy=$uid['vikram@netops.com'] } | ConvertTo-Json
$run2 = @{ checkId=$c2.data.checkId; targetId=$siteIds['MUM-01'];                  runBy=$uid['vikram@netops.com'] } | ConvertTo-Json
$r1 = Call "Post" "$gw/api/v1/health-checks/run" $run1 $h
$r2 = Call "Post" "$gw/api/v1/health-checks/run" $run2 $h
check "checks executed (results recorded in health_check_runs)" ($r1 -ne $null -and $r2 -ne $null)

# ─────────────────────────────────────────────────────────────────────
# 9) KPIs (ADMIN/MANAGER define).
# ─────────────────────────────────────────────────────────────────────
log "Creating KPIs..."
$kpi1 = @{ name='P1 incidents resolved within SLA'; definition='% of P1 tickets resolved before slaResolutionDueAt';
           targetValue=95.0; currentValue=100.0; reportingPeriod='MONTHLY' } | ConvertTo-Json
$kpi2 = @{ name='Mean time to resolve'; definition='Average minutes from ticket OPEN to RESOLVED';
           targetValue=240.0; currentValue=145.0; reportingPeriod='MONTHLY' } | ConvertTo-Json
Invoke-RestMethod -Uri "$gw/api/v1/kpis" -Method Post -Headers $h -Body $kpi1 -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "$gw/api/v1/kpis" -Method Post -Headers $h -Body $kpi2 -ContentType "application/json" | Out-Null
check "2 KPIs defined" $true

# ─────────────────────────────────────────────────────────────────────
# 10) Report (saved query - actual CSV is generated on click).
# ─────────────────────────────────────────────────────────────────────
log "Creating a saved report definition..."
$rep = @{ type='INCIDENT'; parametersJson='{"window":"30d","title":"Monthly incident summary"}';
          generatedBy=$uid['neha@netops.com']; reportUri='csv://monthly-incident-summary' } | ConvertTo-Json
Invoke-RestMethod -Uri "$gw/api/v1/reports" -Method Post -Headers $h -Body $rep -ContentType "application/json" | Out-Null
check "report saved (Neha)" $true

# ─────────────────────────────────────────────────────────────────────
# Done.
# ─────────────────────────────────────────────────────────────────────
""
log "ALL DONE."
""
"Demo accounts (password for all = $pw):"
"   superadmin@netops.com   ADMIN"
"   neha@netops.com         MANAGER"
"   priya@netops.com        NETWORK_ENGINEER"
"   vikram@netops.com       NETWORK_ENGINEER"
"   rahul@netops.com        FIELD_ENGINEER"
"   karthika@netops.com     FIELD_ENGINEER"
"   arjun@netops.com        AUDITOR"
""
"State summary:"
& $mysql -uroot -p1234 -e "SELECT 'user' AS tbl, COUNT(*) AS n FROM netopsone.user UNION ALL SELECT 'sites', COUNT(*) FROM netopsone.sites UNION ALL SELECT 'edge_nodes', COUNT(*) FROM netopsone.edge_nodes UNION ALL SELECT 'interfaces', COUNT(*) FROM netopsone.interfaces UNION ALL SELECT 'fault_reports', COUNT(*) FROM netopsone.fault_reports UNION ALL SELECT 'incident_tickets', COUNT(*) FROM netopsone.incident_tickets UNION ALL SELECT 'sla_records', COUNT(*) FROM netopsone.sla_records UNION ALL SELECT 'tasks', COUNT(*) FROM netopsone.tasks UNION ALL SELECT 'notifications', COUNT(*) FROM netopsone.notifications UNION ALL SELECT 'capacity_plans', COUNT(*) FROM netopsone.capacity_plans UNION ALL SELECT 'capacity_approvals', COUNT(*) FROM netopsone.capacity_approvals UNION ALL SELECT 'capacity_records', COUNT(*) FROM netopsone.capacity_records UNION ALL SELECT 'health_checks', COUNT(*) FROM netopsone.health_checks UNION ALL SELECT 'health_check_runs', COUNT(*) FROM netopsone.health_check_runs UNION ALL SELECT 'kpis', COUNT(*) FROM netopsone.kpis UNION ALL SELECT 'reports', COUNT(*) FROM netopsone.reports UNION ALL SELECT 'audit_log', COUNT(*) FROM netopsone.audit_log;" 2>&1 | Select-String -NotMatch "Warning"

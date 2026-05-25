# NetOpsOne — End-to-End Scenario

A real story walking through the platform, showing how all 5 roles, all the
data, and every page interact.

---

## The cast

| Person | Role | Login |
|---|---|---|
| **Alice** | ADMIN | alice@netops.com |
| **Neha** | MANAGER | neha@netops.com |
| **Priya** | NETWORK_ENGINEER | priya@netops.com |
| **Rahul** | FIELD_ENGINEER | rahul@netops.com |
| **Arjun** | AUDITOR | arjun@netops.com |

The company: **TelcoOps India** — runs a national fibre network.
A new branch is opening in Chennai.

> A built-in `superadmin@netops.com / SuperAdmin@123` ADMIN account is seeded
> on first start (see `SuperAdminSeeder.java`) so a fresh clone is usable
> immediately. Change that password after first login.

---

## Day 0 — Bootstrap (ADMIN)

**Alice logs in** at `http://localhost:4200/login` → JWT issued by user-service
→ redirected to Dashboard.

**Alice's sidebar** shows every section (Infrastructure, Incidents, Capacity,
Monitoring, Personal, Admin).

She does the platform setup:

1. **Admin → Approvals** — sees Priya, Rahul, Neha, Arjun in the pending list.
   Clicks "Approve" on each.
   - *Backend hit:* `PUT /approve-user?userId=…` → user-service flips `status`
     from INACTIVE to ACTIVE → `audit_log` row inserted with `action=APPROVE`.

2. **Admin → Users** — assigns the correct role to each (default after signup
   is FIELD_ENGINEER; she promotes Priya to NETWORK_ENGINEER, Neha to MANAGER,
   Arjun to AUDITOR).
   - *Backend hit:* `PUT /update-role?userId=…&role=…` per user.

3. **Infrastructure → Sites → New site**:
   - Code: `CHN-01`, Name: `Chennai South PoP`, Region: `South`, Status: `ACTIVE`.
   - *Backend hit:* `POST /sites` → site-service inserts row, returns siteId=1.

4. Logs out.

---

## Day 1 — Inventory setup (NETWORK_ENGINEER)

**Priya logs in.** Sidebar shows: Dashboard, Sites, Nodes, Interfaces, Fault
reports, Tickets, Capacity plans, Capacity records, Health checks, My tasks,
Notifications. **No Admin section, no KPIs, no Reports.**

1. **Infrastructure → Sites** — sees `CHN-01 Chennai South PoP`.
   *View only* — no "New site" button for her.

2. **Infrastructure → Nodes → New node**:
   - Site dropdown → picks `1 — Chennai South PoP`.
   - Hostname: `chn01-rtr-01`, Status: `ONLINE`, Model: `Cisco ASR-9001`,
     Serial: `FOC1234ABC`, Mgmt IP: `10.20.1.1`, Installed: today.
   - *Backend hit:* `POST /nodes?siteID=1` → nodeId=1.

3. **Infrastructure → Interfaces → New interface**:
   - Cascading: Site `CHN-01` → Node `chn01-rtr-01`.
   - Name: `Gi0/0/0/0`, Type: `FIBER`, Capacity: `10000` Mbps,
     IP: `10.20.1.2`, Admin: `UP`, Oper: `UP`.
   - *Backend hit:* `POST /nodes/1/interfaces` → interfaceId=1.

4. Adds 3 more interfaces (uplink to Mumbai, two local LAGs).

5. Logs out — network inventory done.

---

## Day 2 — A fault happens (everyone)

At 14:00, an upstream cut breaks the Mumbai uplink.

### Step 1 — Rahul (FIELD_ENGINEER) files a fault report

Sidebar: Dashboard, Sites, Nodes, Interfaces, Fault reports, Tickets, My tasks,
Notifications.

1. **Incidents → Fault reports → New fault report**:
   - Cascading: Site `CHN-01` → Node `chn01-rtr-01` → Interface `Gi0/0/0/1`.
   - Description: `Uplink to Mumbai is down, no LOS but no traffic`.
   - Severity: `HIGH`.
   - *Backend hit:* `POST /api/v1/fault-reports` → incident-service inserts
     row + creates a notification for Priya (the NETWORK_ENGINEER on-call).

### Step 2 — Notification arrives

Priya is logged in; her topbar bell shows a red dot. She clicks **Notifications**.

- Sees the row, status `UNREAD`, message `New high-severity fault on
  chn01-rtr-01 / Gi0/0/0/1`.
- Toggles **Unread only** filter — sees only this one.
- Clicks the ✉️ icon to mark read. Row turns green.
- *Backend hit:* `PATCH /api/v1/notifications/{id}/read`.

### Step 3 — Priya opens an incident ticket

1. **Incidents → Tickets → New ticket**:
   - Picks the fault report from the dropdown.
   - Priority: `P1`. Assigned to: herself.
   - *Backend hit:* `POST /api/v1/tickets` → incident-service creates the
     ticket AND auto-creates an SLA record (response due 30 min, resolve due
     4 hr based on P1).

2. The Tickets page now shows the row with inline SLA columns:
   `SLA response by: 14:30`, `SLA resolve by: 18:00`, badge `WITHIN`.

### Step 4 — Working the ticket

Priya drives to site. She updates ticket status via **⋮ → In progress**.
- *Backend hit:* `PATCH /api/v1/tickets/{id}?status=IN_PROGRESS`.

She attaches a photo of the splice closure:
- **⋮ → View attachments → upload**. Stored, ticketId linked.
- *Backend hit:* `POST /api/v1/tickets/{id}/attachments`.

After fixing the splice, she sets status `RESOLVED`. SLA pill switches to
green; since she resolved at 17:45 (before 18:00), `slaBreached=false`.

---

## Day 3 — Capacity planning (NETWORK_ENGINEER → MANAGER)

The Chennai uplink keeps maxing out at peak. Priya wants 10 → 40 Gbps.

### Step 1 — Priya submits a plan

1. **Capacity → Plans → Submit new plan**:
   - Cascading Site → Node → Interface picker → `Gi0/0/0/1`.
   - Current: `10000` Mbps, Proposed: `40000` Mbps.
   - Reason: `Sustained 95th percentile at 9.2 Gbps during 18:00-22:00.
     Q1 traffic growth forecast 18%.`
   - *Backend hit:* `POST /capacity-plans` → status `PENDING`,
     requestedBy=Priya.

2. Uploads supporting evidence via the 📁 icon on the plan row:
   `chn01-traffic-graph.pdf` with note `MRTG dump for Feb-Apr`.
   - *Backend hit:* `POST /capacity-plans/{id}/evidence` (multipart).

### Step 2 — Neha (MANAGER) approves

Neha's sidebar: Dashboard, Sites, Fault reports, Tickets, Capacity plans,
Capacity records, KPIs, Reports, My tasks, Notifications.
(No nodes/interfaces, no health checks, no admin — she runs the org, not the
boxes.)

1. **Capacity → Plans** — sees Priya's plan, status `PENDING`.
2. Clicks 📁 evidence → downloads and reviews `chn01-traffic-graph.pdf`
   (`GET /capacity-plans/{id}/evidence/{evidenceId}/download`).
3. Satisfied, clicks ✓ **Approve** on the row.
   - *Backend hit:* `POST /capacity-plans/{id}/approve` with
     `{status:APPROVED, approvedBy:Neha, comments:"Approved."}`.
4. Status badge flips to green `APPROVED`.

### Step 3 — Priya logs the post-upgrade measurement

A week later, after the upgrade is done:

1. **Capacity → Records → New record**: same cascading picker, records the
   actual new capacity `40000 Mbps` and peak `12500 Mbps`.
   - *Backend hit:* `POST /capacity-records`.

---

## Day 4 — Monitoring (ADMIN → NETWORK_ENGINEER → AUDITOR)

### Step 1 — Alice defines a health check

1. **Monitoring → Health checks → New check**:
   - Name: `Chennai uplink latency`, Target: `INTERFACE`, Target ID: `2`,
     Condition: `RTT < 50ms`, Active: ✓.
   - *Backend hit:* `POST /api/v1/health-checks`.

### Step 2 — Priya runs it

On the Health checks page, **⋮ → Run now**.
- *Backend hit:* `POST /api/v1/health-checks/run` → returns
  `{result:PASS, latency:23ms}`.
- Snackbar: `Run completed: PASS`.

She clicks **⋮ → View runs** to see the history.
- *Backend hit:* `GET /api/v1/health-checks/{id}/runs`.

### Step 3 — Alice configures a KPI for managers

1. **Monitoring → KPIs → New KPI**:
   - Name: `P1 incidents resolved within SLA`, Target: `95`, Current: `0`,
     Period: `MONTHLY`.
   - *Backend hit:* `POST /api/v1/kpis`.

### Step 4 — Neha generates a monthly report

1. **Monitoring → Reports → Generate report**:
   - Type: `INCIDENT_SUMMARY`, Window: `Last 30 days`,
     Priority filter: `P1`.
   - *Backend hit:* `POST /api/v1/reports`.
2. Report appears in the list; opens it to see counts and SLA stats.

---

## Day 5 — Compliance review (AUDITOR)

Arjun's sidebar: Dashboard, Sites, Fault reports, Tickets, Health checks,
KPIs, Reports, Audit log, Notifications. **Read-only everywhere.**

1. **Admin → Audit log** — wants to verify Neha didn't approve her own work.
   - Filter dropdown → `By user` → picks Neha → **Apply**.
   - *Backend hit:* `GET /audit-logs/by-user?userId=…`.
   - Sees the row: `Neha · APPROVE · PLAN · resourceId=1 · 2026-05-23 10:14`.

2. Filter → `By action` → `APPROVE` → sees every approval in the system.
3. Filter → `By resource` → `TICKET` → sees every ticket state change.

4. **Monitoring → KPIs** — checks the P1 SLA KPI. Current shows `100`
   (only one P1, resolved on time). Green.

5. **Monitoring → Reports** — opens the report Neha generated, confirms
   numbers match the audit trail.

He files no changes; his role can't even if he wanted to. The audit log
itself is append-only at the backend.

---

## Day 6 — Task delegation (MANAGER → FIELD_ENGINEER)

Neha needs Rahul to physically inspect the Chennai splice that caused
Day 2's fault.

1. **Personal → My tasks → Assign task** (only ADMIN/MANAGER see this):
   - Assigned user: `Rahul`.
   - Description: `Re-inspect Chennai splice closure C-12, photograph and
     replace seal.`
   - Related: `TICKET`, ID: `1`. Due: tomorrow.
   - *Backend hit:* `POST /api/v1/tasks`.

2. Rahul gets a notification, goes to **My tasks**, sees the new row with
   status `PENDING`.
3. On site, hits **⋮ → Start** → status `IN_PROGRESS`.
4. After work: **⋮ → Mark completed** → status `COMPLETED`.
5. He toggles **Pending only** to filter out completed work — list is now
   empty. ✅

---

## What's happening under the hood (one round-trip example)

When Rahul clicks "Mark completed":

```
Browser (port 4200, Rahul's session)
   │ Authorization: Bearer <Rahul-JWT>
   │ PATCH /api/v1/tasks/12/status?status=COMPLETED
   ▼
API Gateway (9097)
   │ matches route 'task-service-tasks'
   │ DedupeResponseHeader filter
   │ lb://task-service → Eureka lookup → 9105
   ▼
task-service (9105)
   │ JwtFilter validates token (shared secret), extracts role=FIELD_ENGINEER
   │ TaskController.updateTaskStatus()
   │ Service layer flips status, inserts audit_log row
   │ Returns APIResponse<TaskResponse>
   ▼
Browser
   │ Snackbar: "Task marked COMPLETED"
   │ Reloads list via GET /api/v1/tasks/user/{rahulId}
```

Every service goes through this same pattern. Eureka does the service
discovery, the gateway is the single front door (port 9097), and JWT
carries identity across hops.

---

## Recap of what the project does

1. **User onboarding** — signup creates `INACTIVE` rows; admin approves them
   and sets the right role.
2. **Inventory** — Sites → Nodes → Interfaces (cascading owned-by relationship).
3. **Incident lifecycle** — Fault report → Ticket → SLA tracking → status
   updates → attachments.
4. **Capacity workflow** — engineer submits plan → manager reviews evidence →
   approves → record actuals.
5. **Monitoring** — health checks (with run history), KPIs, generated reports.
6. **Personal work** — tasks assigned by managers/admins to engineers.
7. **Compliance** — every state change writes to `audit_log`, queryable by
   auditor.
8. **Notifications** — async messaging between roles when work changes hands.

That's the whole platform end-to-end.

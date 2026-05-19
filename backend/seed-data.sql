-- ============================================================================
-- NetOpsOne — seed data
-- ----------------------------------------------------------------------------
-- Run in MySQL Workbench against the `netopsone` database AFTER all
-- microservices have started at least once (so Hibernate has created all
-- the tables and columns).
--
-- Safe to re-run: uses ON DUPLICATE KEY UPDATE.
-- ============================================================================

USE netopsone;
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Users (password "secret" for all) ───────────────────────────────────
INSERT INTO user (user_id, name, email, password, phone, role, status) VALUES
  (10, 'Priya Sharma',  'priya@netops.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500001', 'NETWORK_ENGINEER', 'ACTIVE'),
  (11, 'Rahul Verma',   'rahul@netops.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500002', 'FIELD_ENGINEER',   'ACTIVE'),
  (12, 'Neha Iyer',     'neha@netops.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500003', 'MANAGER',          'ACTIVE'),
  (13, 'Arjun Patel',   'arjun@netops.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500004', 'AUDITOR',          'ACTIVE'),
  (14, 'Karthik Raja',  'karthik@netops.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500005', 'NETWORK_ENGINEER', 'ACTIVE'),
  (15, 'Sneha Reddy',   'sneha@netops.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500006', 'FIELD_ENGINEER',   'INACTIVE'),
  (16, 'Vikram Singh',  'vikram@netops.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876500007', 'NETWORK_ENGINEER', 'INACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), role=VALUES(role), status=VALUES(status);

-- ── Sites ────────────────────────────────────────────────────────────────
INSERT INTO sites (site_id, site_code, name, region, address, latitude, longitude, status) VALUES
  (10, 'MUM-01', 'Mumbai Data Center', 'West',  'BKC, Mumbai 400051',         19.0596, 72.8656, 'ACTIVE'),
  (11, 'DEL-01', 'Delhi NCR Hub',      'North', 'Cyber City, Gurgaon 122002', 28.4595, 77.0266, 'ACTIVE'),
  (12, 'HYD-01', 'Hyderabad PoP',      'South', 'HITEC City, Hyderabad',      17.4435, 78.3772, 'MAINTENANCE'),
  (13, 'KOL-01', 'Kolkata Edge',       'East',  'Salt Lake Sector V',         22.5790, 88.4338, 'INACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), region=VALUES(region), status=VALUES(status);

-- ── Vendors ──────────────────────────────────────────────────────────────
INSERT INTO vendor_records (vendor_id, name, contact_info, contract_ref, status) VALUES
  (1, 'Cisco Systems',      'support@cisco.com / +1-800-CISCO',     'CTR-CISCO-2024-001',  'ACTIVE'),
  (2, 'Juniper Networks',   'support@juniper.net / +1-888-JUNIPER', 'CTR-JNPR-2024-007',   'ACTIVE'),
  (3, 'Arista Networks',    'support@arista.com',                   'CTR-ARISTA-2024-003', 'ACTIVE'),
  (4, 'Huawei Enterprise',  'support@huawei.com',                   'CTR-HW-2023-099',     'EXPIRED'),
  (5, 'Nokia Networks',     'noc@nokia.com',                        'CTR-NOK-2024-012',    'ACTIVE'),
  (6, 'Local ISP Partners', 'partners@localisp.in',                 'CTR-LOCAL-2024-021',  'INACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);

-- ── Edge Nodes ──────────────────────────────────────────────────────────
INSERT INTO edge_nodes (node_id, site_id, hostname, model, serial_number, installed_at, status) VALUES
  (10, 1,  'chn-core-01',   'Cisco Catalyst 9500',   'SN-CHN-001', '2023-04-12', 'ONLINE'),
  (11, 1,  'chn-edge-01',   'Cisco Catalyst 9300',   'SN-CHN-002', '2023-05-08', 'ONLINE'),
  (12, 1,  'chn-access-01', 'Juniper EX4400',        'SN-CHN-003', '2023-06-22', 'DEGRADED'),
  (13, 2,  'blr-core-01',   'Arista 7280R3',         'SN-BLR-001', '2022-11-30', 'ONLINE'),
  (14, 2,  'blr-edge-01',   'Cisco Catalyst 9500',   'SN-BLR-002', '2023-01-14', 'MAINTENANCE'),
  (15, 3,  'chn2-core-01',  'Juniper QFX5120',       'SN-CHN2-001','2024-02-01', 'ONLINE'),
  (16, 10, 'mum-core-01',   'Arista 7050X3',         'SN-MUM-001', '2024-03-18', 'ONLINE'),
  (17, 10, 'mum-edge-01',   'Cisco Catalyst 9300',   'SN-MUM-002', '2024-03-18', 'ONLINE'),
  (18, 11, 'del-core-01',   'Juniper MX204',         'SN-DEL-001', '2024-01-09', 'ONLINE'),
  (19, 12, 'hyd-pop-01',    'Nokia 7250 IXR',        'SN-HYD-001', '2023-09-25', 'OFFLINE')
ON DUPLICATE KEY UPDATE hostname=VALUES(hostname), status=VALUES(status);

-- ── Interfaces ───────────────────────────────────────────────────────────
INSERT INTO interfaces (interface_id, node_id, name, type, capacity_mbps, admin_status, oper_status) VALUES
  (10, 10, 'Ge0/0/0',  'FIBER',    10000, 'UP',   'UP'),
  (11, 10, 'Ge0/0/1',  'FIBER',    10000, 'UP',   'UP'),
  (12, 10, 'Ge0/0/2',  'COPPER',    1000, 'UP',   'DOWN'),
  (13, 11, 'Ge0/0/0',  'COPPER',    1000, 'UP',   'UP'),
  (14, 11, 'Ge0/0/1',  'COPPER',    1000, 'UP',   'UP'),
  (15, 13, 'Et1/1',    'FIBER',    40000, 'UP',   'UP'),
  (16, 13, 'Et1/2',    'FIBER',    40000, 'UP',   'UP'),
  (17, 16, 'Et1/1',    'FIBER',    25000, 'UP',   'UP'),
  (18, 18, 'Ge0/0/0',  'FIBER',   100000, 'UP',   'UP')
ON DUPLICATE KEY UPDATE name=VALUES(name), oper_status=VALUES(oper_status);

-- ── Fault Reports ────────────────────────────────────────────────────────
INSERT INTO fault_reports (fault_id, site_id, node_id, interface_id, reported_by, severity, description, reported_at, status) VALUES
  (10, 1,  10, 12, 10, 'HIGH',     'Link flapping on Ge0/0/2, intermittent packet loss during peak hours.', NOW() - INTERVAL 6 HOUR,  'IN_PROGRESS'),
  (11, 2,  14, NULL, 14,'CRITICAL', 'Edge router unreachable from NMS. Possible PSU failure.',              NOW() - INTERVAL 2 HOUR,  'OPEN'),
  (12, 1,  11, NULL, 11,'MEDIUM',  'CPU utilisation consistently above 85%. Investigation needed.',         NOW() - INTERVAL 1 DAY,   'OPEN'),
  (13, 12, 19, NULL, 10,'LOW',     'Cooling fan noise reported by site visit.',                            NOW() - INTERVAL 3 DAY,   'RESOLVED'),
  (14, 10, 16, NULL, 14,'HIGH',    'BGP session drop with upstream provider.',                             NOW() - INTERVAL 12 HOUR, 'IN_PROGRESS')
ON DUPLICATE KEY UPDATE description=VALUES(description), status=VALUES(status);

-- ── Incident Tickets ─────────────────────────────────────────────────────
INSERT INTO incident_tickets (ticket_id, fault_id, created_by, assigned_to, priority, created_at, resolved_at, status, resolution_notes) VALUES
  (10, 10, 10, 10, 'P2', NOW() - INTERVAL 6 HOUR,  NULL,                       'IN_PROGRESS', NULL),
  (11, 11, 14, 14, 'P1', NOW() - INTERVAL 2 HOUR,  NULL,                       'OPEN',        NULL),
  (12, 12, 11, 10, 'P3', NOW() - INTERVAL 1 DAY,   NULL,                       'PENDING',     NULL),
  (13, 13, 10, 11, 'P4', NOW() - INTERVAL 3 DAY,   NOW() - INTERVAL 2 DAY,     'RESOLVED',    'Fan replaced. Verified.'),
  (14, 14, 14, 10, 'P1', NOW() - INTERVAL 12 HOUR, NULL,                       'IN_PROGRESS', 'Engaged ISP NOC.')
ON DUPLICATE KEY UPDATE status=VALUES(status), resolution_notes=VALUES(resolution_notes);

-- ── SLA Records ─────────────────────────────────────────────────────────
INSERT INTO sla_records (sla_id, ticket_id, response_due_at, resolution_due_at, breach_flag) VALUES
  (10, 10, NOW() + INTERVAL 1 HOUR,    NOW() + INTERVAL 18 HOUR, FALSE),
  (11, 11, NOW() + INTERVAL 30 MINUTE, NOW() + INTERVAL 2 HOUR,  FALSE),
  (12, 12, NOW() + INTERVAL 1 HOUR,    NOW() + INTERVAL 23 HOUR, FALSE),
  (13, 13, NOW() - INTERVAL 2 DAY,     NOW() - INTERVAL 1 DAY,   FALSE),
  (14, 14, NOW() + INTERVAL 1 HOUR,    NOW() + INTERVAL 4 HOUR,  FALSE)
ON DUPLICATE KEY UPDATE breach_flag=VALUES(breach_flag);

-- ── Notifications ────────────────────────────────────────────────────────
INSERT INTO notifications (notification_id, user_id, entity_id, message, category, status, created_at) VALUES
  (10, 10, 11, 'P1 ticket #11 assigned to you — Edge router unreachable',  'TICKET',    'UNREAD', NOW() - INTERVAL 2 HOUR),
  (11, 10, 12, 'Ticket #12 still pending — please update',                 'TICKET',    'UNREAD', NOW() - INTERVAL 30 MINUTE),
  (12, 11, 13, 'Ticket #13 closed — Fan replaced',                         'TICKET',    'READ',   NOW() - INTERVAL 1 DAY),
  (13, 14, 14, 'P1 ticket #14 — BGP session drop',                         'TICKET',    'UNREAD', NOW() - INTERVAL 12 HOUR),
  (14, 10, 14, 'Capacity plan #11 awaiting approval',                      'APPROVAL',  'READ',   NOW() - INTERVAL 3 DAY),
  (15, 12, 10, 'New fault reported on chn-core-01',                        'HEALTH_CHECK','UNREAD', NOW() - INTERVAL 6 HOUR)
ON DUPLICATE KEY UPDATE message=VALUES(message), status=VALUES(status);

-- ── Capacity Plans ───────────────────────────────────────────────────────
INSERT INTO capacity_plans (plan_id, site_id, interface_id, current_capacity, proposed_capacity, reason, requested_by, requested_at, status) VALUES
  (10, 1,  12, 1000,   10000,  'Recurring saturation on access uplink.',         10, NOW() - INTERVAL 2 DAY, 'PENDING'),
  (11, 10, 17, 25000,  100000, 'Projected 4x growth from Mumbai expansion.',     14, NOW() - INTERVAL 1 DAY, 'PENDING'),
  (12, 2,  15, 40000,  100000, 'New peering agreement requires 100G uplinks.',   14, NOW() - INTERVAL 5 DAY, 'APPROVED'),
  (13, 11, 18, 100000, 400000, 'Service contract baseline upgrade.',             10, NOW() - INTERVAL 7 DAY, 'REJECTED'),
  (14, 3,  NULL, 0,    1000,   'Add backup uplink at Chennai Hub.',              11, NOW() - INTERVAL 1 HOUR,'DRAFT')
ON DUPLICATE KEY UPDATE reason=VALUES(reason), status=VALUES(status);

-- ── Capacity Records (measurements) ─────────────────────────────────────
INSERT INTO capacity_records (capacity_id, site_id, interface_id, measured_capacity_mbps, recorded_by, measured_at) VALUES
  (10, 1,  10, 8420.5,   10, NOW() - INTERVAL 1 DAY),
  (11, 1,  11, 9105.2,   10, NOW() - INTERVAL 1 DAY),
  (12, 1,  12, 980.0,    10, NOW() - INTERVAL 1 DAY),
  (13, 2,  15, 38240.0,  14, NOW() - INTERVAL 2 HOUR),
  (14, 10, 17, 21560.0,  14, NOW() - INTERVAL 6 HOUR),
  (15, 11, 18, 87600.0,  10, NOW() - INTERVAL 3 HOUR)
ON DUPLICATE KEY UPDATE measured_capacity_mbps=VALUES(measured_capacity_mbps);

-- ── Health Checks ────────────────────────────────────────────────────────
INSERT INTO health_checks (check_id, name, description, target_type, condition_text, created_by, active) VALUES
  (10, 'BGP session uptime',     'Verify BGP sessions to upstream peers',        'NODE',      'bgp_state = ESTABLISHED', 10, TRUE),
  (11, 'Interface error rate',   'Alert if Rx errors > 0.1% over 5 min',         'INTERFACE', 'rx_error_rate < 0.001',   10, TRUE),
  (12, 'CPU utilisation',        'Alert if device CPU > 85% sustained 5 min',    'NODE',      'cpu_util < 0.85',         14, TRUE),
  (13, 'Memory utilisation',     'Memory under 80% threshold',                   'NODE',      'mem_util < 0.80',         14, FALSE),
  (14, 'Site reachability',      'Ping check from NMS to all site gateways',     'SITE',      'icmp_loss < 0.05',        10, TRUE)
ON DUPLICATE KEY UPDATE description=VALUES(description), active=VALUES(active);

-- ── Health Check Runs ───────────────────────────────────────────────────
INSERT INTO health_check_runs (run_id, check_id, target_id, run_by, result, details, run_at) VALUES
  (10, 10, 10, 10, 'PASS', 'BGP session up for 30+ days',                  NOW() - INTERVAL 1 HOUR),
  (11, 11, 12, 10, 'FAIL', 'Rx error rate 0.4% — investigation triggered', NOW() - INTERVAL 6 HOUR),
  (12, 12, 11, 14, 'PASS', 'CPU 62%',                                      NOW() - INTERVAL 12 HOUR),
  (13, 14, 1,  10, 'PASS', '0.0% loss across 5 probes',                    NOW() - INTERVAL 30 MINUTE),
  (14, 12, 14, 14, 'FAIL', 'CPU 91% sustained 8 min',                      NOW() - INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE result=VALUES(result), details=VALUES(details);

-- ── KPIs ─────────────────────────────────────────────────────────────────
INSERT INTO kpis (kpi_id, name, definition, target_value, current_value, reporting_period) VALUES
  (10, 'Service uptime',                'Percentage uptime across all critical services', 99.9,  99.95, 'MONTHLY'),
  (11, 'MTTR (Mean Time to Resolve)',   'Average ticket resolution time in hours',         4.0,   3.2,  'MONTHLY'),
  (12, 'P1 SLA compliance',             'Percentage of P1 tickets resolved within SLA',  100.0,  98.0, 'MONTHLY'),
  (13, 'Network capacity headroom',     'Average free capacity across critical links',    20.0,  18.5, 'QUARTERLY'),
  (14, 'Audit compliance',              'Percentage of audit events captured',           100.0, 100.0, 'MONTHLY')
ON DUPLICATE KEY UPDATE current_value=VALUES(current_value);

-- ── Reports ──────────────────────────────────────────────────────────────
INSERT INTO reports (report_id, type, parameters_json, report_uri, generated_by, generated_at) VALUES
  (10, 'CAPACITY', '{"month":"2026-04","sites":"all"}',     '/reports/cap-202604.pdf', 12, NOW() - INTERVAL 10 DAY),
  (11, 'INCIDENT', '{"severity":"P1","window":"30d"}',      '/reports/inc-p1-30d.pdf', 12, NOW() - INTERVAL 5 DAY),
  (12, 'SLA',      '{"framework":"P1-tickets"}',            '/reports/sla-p1.pdf',     13, NOW() - INTERVAL 1 DAY),
  (13, 'INCIDENT', '{"resourceType":"User"}',               '/reports/inc-users.pdf',  13, NOW() - INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE report_uri=VALUES(report_uri);

-- ── Tasks ────────────────────────────────────────────────────────────────
INSERT INTO tasks (task_id, user_id, related_entity_id, description, due_date, status) VALUES
  (10, 11, 10, 'Replace SFP on Ge0/0/2 at Chennai DC',                 DATE_ADD(CURDATE(), INTERVAL 1 DAY),  'PENDING'),
  (11, 11, 11, 'Field visit to Bangalore DC for edge router PSU swap',  DATE_ADD(CURDATE(), INTERVAL 2 DAY),  'PENDING'),
  (12, 10, 12, 'Investigate sustained high CPU on chn-edge-01',         DATE_ADD(CURDATE(), INTERVAL 3 DAY),  'IN_PROGRESS'),
  (13, 14, 14, 'Engage ISP NOC for BGP drop at Mumbai',                 CURDATE(),                            'IN_PROGRESS'),
  (14, 10, NULL,'Quarterly capacity review',                            DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'PENDING'),
  (15, 11, 13, 'Verify Hyderabad PoP cooling after repair',             DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'COMPLETED')
ON DUPLICATE KEY UPDATE description=VALUES(description), status=VALUES(status);

-- ── Audit Log entries ───────────────────────────────────────────────────
INSERT INTO audit_log (audit_id, user_id, action, resource_type, resource_id, details, timestamp) VALUES
  (100, 1,  'LOGIN',                    'User',           '1',  'Super Admin signed in',                NOW() - INTERVAL 5 HOUR),
  (101, 12, 'APPROVE_CAPACITY_PLAN',    'CapacityPlan',   '12', 'Plan #12 approved by manager',         NOW() - INTERVAL 4 DAY),
  (102, 12, 'REJECT_CAPACITY_PLAN',     'CapacityPlan',   '13', 'Plan #13 rejected — budget',           NOW() - INTERVAL 6 DAY),
  (103, 10, 'CREATE_TICKET',            'IncidentTicket', '10', 'P2 ticket created for fault #10',      NOW() - INTERVAL 6 HOUR),
  (104, 14, 'CREATE_TICKET',            'IncidentTicket', '11', 'P1 ticket — Edge router unreachable',  NOW() - INTERVAL 2 HOUR),
  (105, 10, 'UPDATE_STATUS',            'IncidentTicket', '13', 'Ticket marked RESOLVED',               NOW() - INTERVAL 2 DAY),
  (106, 14, 'CREATE_HEALTH_CHECK',      'HealthCheck',    '12', 'CPU utilisation check created',        NOW() - INTERVAL 7 DAY),
  (107, 13, 'GENERATE_REPORT',          'Report',         '12', 'SLA P1 compliance report',             NOW() - INTERVAL 1 DAY),
  (108, 13, 'GENERATE_REPORT',          'Report',         '13', 'Incident report',                      NOW() - INTERVAL 2 HOUR),
  (109, 1,  'UPDATE_USER_ROLE',         'User',           '12', 'Promoted Neha Iyer to MANAGER',        NOW() - INTERVAL 30 DAY)
ON DUPLICATE KEY UPDATE details=VALUES(details);

SET FOREIGN_KEY_CHECKS = 1;

-- ── Sanity check ────────────────────────────────────────────────────────
SELECT 'user' AS tbl, COUNT(*) AS n FROM user
UNION ALL SELECT 'sites',             COUNT(*) FROM sites
UNION ALL SELECT 'vendor_records',    COUNT(*) FROM vendor_records
UNION ALL SELECT 'edge_nodes',        COUNT(*) FROM edge_nodes
UNION ALL SELECT 'interfaces',        COUNT(*) FROM interfaces
UNION ALL SELECT 'fault_reports',     COUNT(*) FROM fault_reports
UNION ALL SELECT 'incident_tickets',  COUNT(*) FROM incident_tickets
UNION ALL SELECT 'sla_records',       COUNT(*) FROM sla_records
UNION ALL SELECT 'notifications',     COUNT(*) FROM notifications
UNION ALL SELECT 'capacity_plans',    COUNT(*) FROM capacity_plans
UNION ALL SELECT 'capacity_records',  COUNT(*) FROM capacity_records
UNION ALL SELECT 'health_checks',     COUNT(*) FROM health_checks
UNION ALL SELECT 'health_check_runs', COUNT(*) FROM health_check_runs
UNION ALL SELECT 'kpis',              COUNT(*) FROM kpis
UNION ALL SELECT 'reports',           COUNT(*) FROM reports
UNION ALL SELECT 'tasks',             COUNT(*) FROM tasks
UNION ALL SELECT 'audit_log',         COUNT(*) FROM audit_log;

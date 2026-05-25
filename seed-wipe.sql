-- Hard reset: drop every business row, keep only the seeded superadmin.
USE netopsone;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_log;
TRUNCATE TABLE capacity_approvals;
TRUNCATE TABLE capacity_plans;
TRUNCATE TABLE capacity_records;
TRUNCATE TABLE change_evidence;
TRUNCATE TABLE edge_nodes;
TRUNCATE TABLE fault_reports;
TRUNCATE TABLE health_check_runs;
TRUNCATE TABLE health_checks;
TRUNCATE TABLE incident_tickets;
TRUNCATE TABLE interfaces;
TRUNCATE TABLE kpis;
TRUNCATE TABLE notifications;
TRUNCATE TABLE reports;
TRUNCATE TABLE sites;
TRUNCATE TABLE sla_records;
TRUNCATE TABLE tasks;
TRUNCATE TABLE ticket_attachments;
TRUNCATE TABLE vendor_records;

DELETE FROM user WHERE email <> 'superadmin@netops.com';

SET FOREIGN_KEY_CHECKS = 1;

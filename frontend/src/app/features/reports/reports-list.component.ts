import { ReportFormDialog } from './report-form-dialog.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule, MatProgressBarModule,
  ],
  templateUrl: './reports-list.component.html',
  styleUrl: './reports-list.component.css',
})
export class ReportsListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private currentUser = inject(CurrentUserService);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);
  downloading = signal<number | null>(null);

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.reports().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(ReportFormDialog, { width: '420px' });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Report generated', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  /** Render the parametersJson blob as a friendly chip-style string. */
  humanParams(raw: string): string {
    if (!raw) return '—';
    try {
      const o = JSON.parse(raw);
      return Object.entries(o)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    } catch {
      return raw;
    }
  }

  /**
   * Live-build the report on demand:
   *   1. Re-fetch the source data for this report's type.
   *   2. Apply the saved filters (severity / priority / time window).
   *   3. Build a CSV string in memory.
   *   4. Trigger a browser download as report-<id>-<type>.csv.
   *
   * No filesystem on the backend, no static-file server — just the data
   * the user is already authorised to see, re-shaped into a downloadable
   * artefact at click-time.
   */
  download(r: any) {
    this.downloading.set(r.reportId);
    const params = this.safeParse(r.parametersJson);

    if (r.type === 'INCIDENT') {
      forkJoin({ tickets: this.api.tickets(), faults: this.api.faultReports() }).subscribe({
        next: ({ tickets, faults }) => this.deliverCsv(buildIncidentCsv(tickets, faults, params), r),
        error: (e) => this.fail(e),
      });
    } else if (r.type === 'SLA') {
      this.api.tickets().subscribe({
        next: (tickets) => this.deliverCsv(buildSlaCsv(tickets, params), r),
        error: (e) => this.fail(e),
      });
    } else if (r.type === 'CAPACITY') {
      forkJoin({ plans: this.api.capacityPlans(), records: this.api.capacityRecords() }).subscribe({
        next: ({ plans, records }) => this.deliverCsv(buildCapacityCsv(plans, records, params), r),
        error: (e) => this.fail(e),
      });
    } else {
      this.fail(new Error('Unknown report type: ' + r.type));
    }
  }

  private deliverCsv(csv: string, r: any) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameFor(r);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    this.downloading.set(null);
    this.snack.open('Report downloaded', 'OK', { duration: 2000 });
  }

  private fail(err: any) {
    this.downloading.set(null);
    this.snack.open(err?.message ?? 'Could not generate report', 'OK', { duration: 4000 });
  }

  private safeParse(s: string): Record<string, any> {
    try { return JSON.parse(s || '{}'); } catch { return {}; }
  }
}

// ════════════════════════════════════════════════════════════════════════
// CSV builders — keep them outside the component so they're easy to test.
// ════════════════════════════════════════════════════════════════════════

/** Quote a single CSV field (RFC-4180 minimalist). */
function csvCell(v: any): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cols: any[]): string {
  return cols.map(csvCell).join(',');
}

/** Filter rows by a `window` string like '7d', '30d', '90d', '1y', 'all'. */
function applyWindow<T extends { [k: string]: any }>(rows: T[], dateField: string, window: string): T[] {
  if (!window || window === 'all') return rows;
  const now = Date.now();
  const days = window === '7d' ? 7 : window === '30d' ? 30 : window === '90d' ? 90 : window === '1y' ? 365 : 0;
  if (!days) return rows;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return rows.filter((r) => {
    const v = r[dateField];
    if (!v) return true;
    return new Date(v).getTime() >= cutoff;
  });
}

function buildIncidentCsv(tickets: any[], faults: any[], params: any): string {
  let t = applyWindow(tickets, 'createdAt', params.window);
  let f = applyWindow(faults,  'reportedAt', params.window);

  if (params.severity) {
    const allowed: string[] =
      params.severity === 'CRITICAL' ? ['CRITICAL']
    : params.severity === 'HIGH'     ? ['CRITICAL', 'HIGH']
    : params.severity === 'MEDIUM'   ? ['CRITICAL', 'HIGH', 'MEDIUM']
    : [];
    if (allowed.length) f = f.filter((x) => allowed.includes((x.severity || '').toUpperCase()));
  }

  const lines: string[] = [];
  lines.push(`# Incident report  generated ${new Date().toISOString()}  window=${params.window ?? 'all'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Total fault reports', f.length]));
  lines.push(csvRow(['Open faults',         f.filter((x) => x.status === 'OPEN').length]));
  lines.push(csvRow(['Resolved faults',     f.filter((x) => x.status === 'RESOLVED').length]));
  lines.push(csvRow(['Total tickets',       t.length]));
  lines.push(csvRow(['Tickets resolved',    t.filter((x) => x.status === 'RESOLVED' || x.status === 'CLOSED').length]));
  lines.push(csvRow(['SLA breached',        t.filter((x) => x.slaBreached).length]));
  lines.push('');
  lines.push('## Tickets');
  lines.push(csvRow(['ticketId', 'faultId', 'priority', 'status', 'createdBy', 'assignedTo',
                     'createdAt', 'resolvedAt', 'slaResolutionDueAt', 'slaBreached']));
  for (const x of t) {
    lines.push(csvRow([x.ticketId, x.faultId, x.priority, x.status,
                       x.createdByName, x.assignedToName,
                       x.createdAt, x.resolvedAt,
                       x.slaResolutionDueAt, x.slaBreached]));
  }
  lines.push('');
  lines.push('## Fault reports');
  lines.push(csvRow(['faultId', 'site', 'node', 'interface', 'severity', 'status',
                     'reportedBy', 'reportedAt', 'description']));
  for (const x of f) {
    lines.push(csvRow([x.faultId, x.siteName, x.nodeHostname, x.interfaceName,
                       x.severity, x.status, x.reportedByName, x.reportedAt, x.description]));
  }
  return lines.join('\n');
}

function buildSlaCsv(tickets: any[], params: any): string {
  let t = applyWindow(tickets, 'createdAt', params.window);
  if (params.priority) {
    const allowed: string[] =
      params.priority === 'P1' ? ['P1']
    : params.priority === 'P2' ? ['P1', 'P2']
    : [];
    if (allowed.length) t = t.filter((x) => allowed.includes((x.priority || '').toUpperCase()));
  }

  const tracked  = t.filter((x) => x.slaId != null);
  const breached = tracked.filter((x) => x.slaBreached);
  const compliancePct = tracked.length
    ? (((tracked.length - breached.length) / tracked.length) * 100).toFixed(1)
    : '—';

  const lines: string[] = [];
  lines.push(`# SLA compliance report  generated ${new Date().toISOString()}  window=${params.window ?? 'all'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Tickets tracked by SLA', tracked.length]));
  lines.push(csvRow(['Within SLA',             tracked.length - breached.length]));
  lines.push(csvRow(['Breached',               breached.length]));
  lines.push(csvRow(['Compliance %',           compliancePct]));
  lines.push('');
  lines.push('## Detail');
  lines.push(csvRow(['ticketId', 'priority', 'status', 'createdAt', 'resolvedAt',
                     'slaResponseDueAt', 'slaResolutionDueAt', 'slaBreached']));
  for (const x of tracked) {
    lines.push(csvRow([x.ticketId, x.priority, x.status, x.createdAt, x.resolvedAt,
                       x.slaResponseDueAt, x.slaResolutionDueAt, x.slaBreached]));
  }
  return lines.join('\n');
}

function buildCapacityCsv(plans: any[], records: any[], params: any): string {
  const p = applyWindow(plans,   'requestedAt', params.window);
  const r = applyWindow(records, 'recordedAt',  params.window);

  const lines: string[] = [];
  lines.push(`# Capacity report  generated ${new Date().toISOString()}  window=${params.window ?? 'all'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Total plans',     p.length]));
  lines.push(csvRow(['Approved plans',  p.filter((x) => x.status === 'APPROVED').length]));
  lines.push(csvRow(['Pending plans',   p.filter((x) => x.status === 'PENDING').length]));
  lines.push(csvRow(['Rejected plans',  p.filter((x) => x.status === 'REJECTED').length]));
  lines.push(csvRow(['Capacity records', r.length]));
  lines.push('');
  lines.push('## Plans');
  lines.push(csvRow(['planId', 'site', 'currentMbps', 'proposedMbps',
                     'status', 'requestedBy', 'requestedAt', 'reason']));
  for (const x of p) {
    lines.push(csvRow([x.planId, x.siteName, x.currentCapacity, x.proposedCapacity,
                       x.status, x.requestedByName, x.requestedAt, x.reason]));
  }
  lines.push('');
  lines.push('## Records');
  lines.push(csvRow(['recordId', 'site', 'node', 'interface',
                     'measuredMbps', 'peakMbps', 'recordedAt']));
  for (const x of r) {
    lines.push(csvRow([x.recordId, x.siteName, x.nodeHostname, x.interfaceName,
                       x.measuredCapacity ?? x.measuredMbps,
                       x.peakUsage ?? x.peakMbps,
                       x.recordedAt]));
  }
  return lines.join('\n');
}

function filenameFor(r: any): string {
  const params = (() => { try { return JSON.parse(r.parametersJson || '{}'); } catch { return {}; }})();
  const title  = params.title ? String(params.title).toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
  const stem   = title || `${r.type.toLowerCase()}-${params.window || 'all'}`;
  const stamp  = new Date(r.generatedAt || Date.now()).toISOString().slice(0, 10);
  return `report-${r.reportId}-${stem}-${stamp}.csv`;
}

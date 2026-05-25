import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-fault-reports-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressBarModule, MatMenuModule,
  ],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Fault reports</h1>
          <p class="muted">Reported network faults across all sites</p>
        </div>
        @if (auth.hasRole('ADMIN','MANAGER','NETWORK_ENGINEER','FIELD_ENGINEER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> Report new fault
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th>
              <th>Site</th><th>Node</th><th>Interface</th>
              <th>Reported by</th>
              <th>Severity</th><th>Description</th><th>Status</th><th>Reported</th>
              @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER')) { <th>Update</th> }
            </tr>
          </thead>
          <tbody>
            @for (f of rows(); track f.faultId) {
              <tr>
                <td class="num">{{ f.faultId }}</td>
                <td>
                  @if (f.siteName) {
                    <div>{{ f.siteName }}</div>
                    <small class="muted">#{{ f.siteId }}</small>
                  } @else { — }
                </td>
                <td>
                  @if (f.nodeHostname) {
                    <div>{{ f.nodeHostname }}</div>
                    <small class="muted">#{{ f.nodeId }}</small>
                  } @else { <span class="muted">—</span> }
                </td>
                <td>
                  @if (f.interfaceName) {
                    <div>{{ f.interfaceName }}</div>
                    <small class="muted">#{{ f.interfaceId }}</small>
                  } @else { <span class="muted">—</span> }
                </td>
                <td>{{ f.reportedByName || '—' }}</td>
                <td><span class="pri" [class]="'pri-' + (f.severity || '').toLowerCase()">{{ f.severity }}</span></td>
                <td class="ellipsis">{{ f.description }}</td>
                <td><span class="pill" [class]="'pill-' + (f.status || '').toLowerCase()">{{ f.status }}</span></td>
                <td class="muted">{{ f.reportedAt | date:'short' }}</td>
                @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER','MANAGER')) {
                  <td>
                    <button mat-icon-button [matMenuTriggerFor]="m"><mat-icon>more_vert</mat-icon></button>
                    <mat-menu #m="matMenu">
                      @if (auth.hasRole('ADMIN','MANAGER','NETWORK_ENGINEER') && f.status !== 'CLOSED') {
                        <button mat-menu-item (click)="escalate(f)">
                          <mat-icon>confirmation_number</mat-icon>Escalate to ticket
                        </button>
                      }
                      @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER')) {
                        <button mat-menu-item (click)="updateStatus(f.faultId, 'IN_PROGRESS')"><mat-icon>play_arrow</mat-icon>Mark in progress</button>
                        <button mat-menu-item (click)="updateStatus(f.faultId, 'RESOLVED')"><mat-icon>check_circle</mat-icon>Mark resolved</button>
                        <button mat-menu-item (click)="updateStatus(f.faultId, 'CLOSED')"><mat-icon>archive</mat-icon>Close</button>
                      }
                    </mat-menu>
                  </td>
                }
              </tr>
            } @empty {
              <tr><td colspan="10" class="empty">No fault reports yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0; }
    .hdr p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
    .muted { color: var(--text-muted); }
    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); white-space: nowrap; }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .ellipsis { max-width: 280px; overflow: hidden; text-overflow: ellipsis; }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .dt td small.muted { font-size: 10px; font-variant-numeric: tabular-nums; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-open        { background: var(--info-bg); color: var(--info-fg); }
    .pill-in_progress { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-resolved    { background: var(--success-bg); color: var(--success-fg); }
    .pill-closed      { background: var(--danger-bg); color: var(--danger-fg); }
    .pri { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.05em; }
    .pri-critical { background: #fee2e2; color: #991b1b; }
    .pri-high     { background: #fed7aa; color: #9a3412; }
    .pri-medium   { background: #fef3c7; color: #92400e; }
    .pri-low      { background: #d1fae5; color: #065f46; }
  `,
})
export class FaultReportsListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private currentUser = inject(CurrentUserService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.faultReports().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(FaultReportFormDialog, { width: '480px' });
    ref.afterClosed().subscribe((created) => {
      if (created) { this.snack.open('Fault reported', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  escalate(fault: any) {
    const ref = this.dialog.open(EscalateToTicketDialog, { width: '460px', data: { fault } });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.snack.open(`Ticket #${created.ticketId} opened for fault #${fault.faultId}`, 'OK', { duration: 3500 });
        this.refresh();
      }
    });
  }

  updateStatus(faultId: number, status: string) {
    this.api.updateFaultStatus(faultId, status).subscribe({
      next: () => { this.snack.open(`Fault marked ${status}`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Update failed', 'OK', { duration: 4000 }),
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Report-fault dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-fault-report-form-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Report a new fault</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Site</mat-label>
          <mat-select name="siteId" [(ngModel)]="model.siteId" (selectionChange)="onSiteChange($event.value)" required>
            @for (s of sites(); track s.siteId) {
              <mat-option [value]="s.siteId">{{ s.siteCode }} — {{ s.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select name="severity" [(ngModel)]="model.severity" required>
            @for (s of severities; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Node (optional)</mat-label>
          <mat-select name="nodeId" [(ngModel)]="model.nodeId" (selectionChange)="onNodeChange($event.value)"
                      [disabled]="!model.siteId || !nodes().length">
            <mat-option [value]="null">— none —</mat-option>
            @for (n of nodes(); track n.nodeId) {
              <mat-option [value]="n.nodeId">{{ n.hostname }} ({{ n.model || 'node' }})</mat-option>
            }
          </mat-select>
          @if (model.siteId && !nodes().length && !loadingNodes()) {
            <mat-hint>No nodes at this site</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Interface (optional)</mat-label>
          <mat-select name="interfaceId" [(ngModel)]="model.interfaceId"
                      [disabled]="!model.nodeId || !interfaces().length">
            <mat-option [value]="null">— none —</mat-option>
            @for (i of interfaces(); track i.interfaceId) {
              <mat-option [value]="i.interfaceId">{{ i.name }} ({{ i.capacityMbps }} Mbps)</mat-option>
            }
          </mat-select>
          @if (model.nodeId && !interfaces().length && !loadingIfaces()) {
            <mat-hint>No interfaces on this node</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" name="description" [(ngModel)]="model.description" required
                    placeholder="What's wrong? Be specific."></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">Report fault</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 12px !important; }
    .col-span-2 { grid-column: span 2; }
  `,
})
export class FaultReportFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<FaultReportFormDialog>);
  private currentUser = inject(CurrentUserService);

  severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  model = {
    siteId: null as number | null,
    nodeId: null as number | null,
    interfaceId: null as number | null,
    severity: 'MEDIUM',
    description: '',
  };

  sites      = signal<any[]>([]);
  nodes      = signal<any[]>([]);
  interfaces = signal<any[]>([]);
  loadingNodes  = signal(false);
  loadingIfaces = signal(false);

  ngOnInit() {
    this.api.sites().subscribe({
      next: (s) => this.sites.set(s),
      error: () => this.snack.open('Could not load sites', 'OK', { duration: 3000 }),
    });
  }

  onSiteChange(siteId: number | null) {
    this.model.nodeId = null;
    this.model.interfaceId = null;
    this.nodes.set([]);
    this.interfaces.set([]);
    if (!siteId) return;
    this.loadingNodes.set(true);
    this.api.nodesBySite(siteId).subscribe({
      next: (n) => { this.nodes.set(n); this.loadingNodes.set(false); },
      error: () => { this.nodes.set([]); this.loadingNodes.set(false); },
    });
  }

  onNodeChange(nodeId: number | null) {
    this.model.interfaceId = null;
    this.interfaces.set([]);
    if (!nodeId) return;
    this.loadingIfaces.set(true);
    this.api.interfacesByNode(nodeId).subscribe({
      next: (i) => { this.interfaces.set(i); this.loadingIfaces.set(false); },
      error: () => { this.interfaces.set([]); this.loadingIfaces.set(false); },
    });
  }

  submit() {
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    const body: any = { reportedById: userId, siteId: this.model.siteId,
                        severity: this.model.severity, description: this.model.description };
    if (this.model.nodeId)      body.nodeId      = this.model.nodeId;
    if (this.model.interfaceId) body.interfaceId = this.model.interfaceId;
    this.api.createFaultReport(body).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Submission failed', 'OK', { duration: 4000 }),
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Escalate-to-ticket dialog
//
// Opens an incident ticket linked to a fault report. Backend auto-creates
// the matching SLA record (response due 1h, resolution due 4h for P1 / 24h
// for others), so this is the single step that turns a "reported fault"
// into a "tracked incident".
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-escalate-to-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>confirmation_number</mat-icon> Escalate fault #{{ data.fault.faultId }} to ticket
    </h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        <p class="muted ctx">
          {{ data.fault.siteName }} ·
          {{ data.fault.nodeHostname || '—' }} ·
          severity <strong>{{ data.fault.severity }}</strong>
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Priority</mat-label>
          <mat-select name="priority" [(ngModel)]="model.priority" required>
            <mat-option value="P1">P1 — Critical (resolve in 4h)</mat-option>
            <mat-option value="P2">P2 — High (resolve in 24h)</mat-option>
            <mat-option value="P3">P3 — Medium (resolve in 24h)</mat-option>
            <mat-option value="P4">P4 — Low (resolve in 24h)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Assign to (optional)</mat-label>
          <mat-select name="assignedToId" [(ngModel)]="model.assignedToId">
            <mat-option [value]="null">— Leave unassigned —</mat-option>
            @for (u of assignees(); track u.userId) {
              <mat-option [value]="u.userId">{{ u.name || u.email }} — {{ u.role }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">
          Open ticket
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .col { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .ctx { font-size: 12px; margin: 0 0 8px; }
    .muted { color: var(--text-muted); }
  `,
})
export class EscalateToTicketDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<EscalateToTicketDialog>);
  private currentUser = inject(CurrentUserService);

  assignees = signal<any[]>([]);
  model: any = { priority: 'P3', assignedToId: null };

  constructor(@Inject(MAT_DIALOG_DATA) public data: { fault: any }) {
    // Default priority is derived from fault severity.
    const sev = (data.fault.severity || '').toUpperCase();
    this.model.priority =
      sev === 'CRITICAL' ? 'P1' :
      sev === 'HIGH'     ? 'P2' :
      sev === 'MEDIUM'   ? 'P3' : 'P4';
  }

  ngOnInit() {
    // Only show users who can actually work on incidents.
    this.api.users().subscribe({
      next: (u) => this.assignees.set(
        u.filter((x) => ['ADMIN', 'NETWORK_ENGINEER', 'FIELD_ENGINEER'].includes(x.role))
      ),
    });
  }

  submit() {
    const me = this.currentUser.userId();
    if (!me) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    const body: any = {
      faultId: this.data.fault.faultId,
      createdById: me,
      priority: this.model.priority,
    };
    if (this.model.assignedToId) body.assignedToId = this.model.assignedToId;

    this.api.createTicket(body).subscribe({
      next: (created) => this.ref.close(created),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Could not open ticket', 'OK', { duration: 4000 }),
    });
  }
}

import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatMenuModule,
            MatProgressBarModule, MatDialogModule, MatDividerModule],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Incident tickets</h1>
          <p class="muted">Open and resolved incidents with SLA tracking</p>
        </div>
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Fault</th><th>Priority</th><th>Created by</th>
              <th>Assigned to</th><th>Status</th><th>Created</th><th>Resolved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of rows(); track t.ticketId) {
              <tr>
                <td class="num">{{ t.ticketId }}</td>
                <td class="num">{{ t.faultId }}</td>
                <td><span class="pri" [class]="'pri-' + (t.priority || '').toLowerCase()">{{ t.priority }}</span></td>
                <td>{{ t.createdByName || '—' }}</td>
                <td>{{ t.assignedToName || '—' }}</td>
                <td><span class="pill" [class]="'pill-' + (t.status || '').toLowerCase()">{{ t.status }}</span></td>
                <td class="muted">{{ t.createdAt | date:'short' }}</td>
                <td class="muted">{{ t.resolvedAt ? (t.resolvedAt | date:'short') : '—' }}</td>
                <td>
                  <button mat-icon-button [matMenuTriggerFor]="m" matTooltip="Actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #m="matMenu">
                    <button mat-menu-item (click)="viewSla(t.ticketId)">
                      <mat-icon>schedule</mat-icon>View SLA
                    </button>
                    <button mat-menu-item (click)="viewAttachments(t.ticketId)">
                      <mat-icon>attach_file</mat-icon>View attachments
                    </button>
                    @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER','MANAGER') && t.status !== 'CLOSED') {
                      <mat-divider />
                      <button mat-menu-item (click)="updateStatus(t.ticketId, 'IN_PROGRESS')"><mat-icon>play_arrow</mat-icon>In progress</button>
                      <button mat-menu-item (click)="updateStatus(t.ticketId, 'PENDING')"><mat-icon>hourglass_top</mat-icon>Pending</button>
                      <button mat-menu-item (click)="updateStatus(t.ticketId, 'RESOLVED')"><mat-icon>check_circle</mat-icon>Resolved</button>
                      <button mat-menu-item (click)="updateStatus(t.ticketId, 'CLOSED')"><mat-icon>archive</mat-icon>Close</button>
                    }
                  </mat-menu>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">No tickets yet.</td></tr>
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
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-open        { background: var(--info-bg); color: var(--info-fg); }
    .pill-in_progress, .pill-pending { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-resolved    { background: var(--success-bg); color: var(--success-fg); }
    .pill-closed      { background: var(--danger-bg); color: var(--danger-fg); }
    .pri { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.05em; }
    .pri-p1 { background: #fee2e2; color: #991b1b; }
    .pri-p2 { background: #fed7aa; color: #9a3412; }
    .pri-p3 { background: #fef3c7; color: #92400e; }
    .pri-p4 { background: #d1fae5; color: #065f46; }
  `,
})
export class TicketsListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.tickets().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(ticketId: number, status: string) {
    this.api.updateTicketStatus(ticketId, status).subscribe({
      next: () => { this.snack.open(`Ticket marked ${status}`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Update failed', 'OK', { duration: 4000 }),
    });
  }

  viewSla(ticketId: number) {
    this.dialog.open(SlaDialogComponent, { width: '420px', data: { ticketId } });
  }

  viewAttachments(ticketId: number) {
    this.dialog.open(AttachmentsDialogComponent, { width: '560px', data: { ticketId } });
  }
}

// ────────────────────────────────────────────────────────────────────────
// SLA Record viewer dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-sla-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>schedule</mat-icon> SLA for ticket #{{ data.ticketId }}
    </h2>
    <mat-dialog-content>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (sla(); as s) {
        <dl class="kv">
          <dt>SLA record ID</dt><dd class="num">{{ s.slaId }}</dd>
          <dt>Ticket ID</dt><dd class="num">{{ s.ticketId }}</dd>
          <dt>Response due</dt><dd>{{ s.responseDueAt | date:'medium' }}</dd>
          <dt>Resolution due</dt><dd>{{ s.resolutionDueAt | date:'medium' }}</dd>
          <dt>Breached</dt>
          <dd>
            @if (s.breachFlag) {
              <span class="pill breached">BREACHED</span>
            } @else {
              <span class="pill ok">WITHIN SLA</span>
            }
          </dd>
        </dl>
      } @else if (!loading()) {
        <div class="empty">
          <mat-icon>info</mat-icon>
          <p>No SLA record found for this ticket.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .kv { display: grid; grid-template-columns: 130px 1fr; gap: 8px 16px; padding: 12px 0; }
    .kv dt { color: var(--text-muted); font-weight: 500; }
    .kv dd { margin: 0; }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .pill { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px;
            letter-spacing: 0.04em; text-transform: uppercase; }
    .pill.breached { background: var(--danger-bg); color: var(--danger-fg); }
    .pill.ok       { background: var(--success-bg); color: var(--success-fg); }
    .empty { text-align: center; padding: 24px; color: var(--text-faint); }
    .empty mat-icon { font-size: 36px !important; height: 36px !important; width: 36px !important; }
  `,
})
export class SlaDialogComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  sla = signal<any | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticketId: number }) {}

  ngOnInit() {
    this.api.ticketSla(this.data.ticketId).subscribe({
      next: (s) => { this.sla.set(s); this.loading.set(false); },
      error: () => { this.sla.set(null); this.loading.set(false); },
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Ticket attachments viewer dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-attachments-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>attach_file</mat-icon> Attachments for ticket #{{ data.ticketId }}
    </h2>
    <mat-dialog-content>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (attachments().length) {
        <table class="dt">
          <thead><tr><th>ID</th><th>File</th><th>Description</th><th>Uploaded by</th><th>When</th></tr></thead>
          <tbody>
            @for (a of attachments(); track a.attachmentId) {
              <tr>
                <td class="num">{{ a.attachmentId }}</td>
                <td><a [href]="a.fileUri" target="_blank">{{ a.fileUri }}</a></td>
                <td>{{ a.description || '—' }}</td>
                <td>{{ a.uploadedByName || '—' }}</td>
                <td class="muted">{{ a.uploadedAt | date:'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (!loading()) {
        <div class="empty">
          <mat-icon>cloud_off</mat-icon>
          <p>No attachments uploaded to this ticket.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 8px; }
    .dt th, .dt td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;
             letter-spacing: 0.04em; background: #fafbfc; }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .muted { color: var(--text-muted); }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .empty mat-icon { font-size: 36px !important; height: 36px !important; width: 36px !important; }
  `,
})
export class AttachmentsDialogComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  attachments = signal<any[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticketId: number }) {}

  ngOnInit() {
    this.api.ticketAttachments(this.data.ticketId).subscribe({
      next: (a) => { this.attachments.set(a); this.loading.set(false); },
      error: () => { this.attachments.set([]); this.loading.set(false); },
    });
  }
}

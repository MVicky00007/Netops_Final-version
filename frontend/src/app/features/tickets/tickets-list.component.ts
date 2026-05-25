import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

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
        @if (auth.hasRole('ADMIN','MANAGER','NETWORK_ENGINEER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> New ticket
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <div class="scroll">
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Fault</th><th>Priority</th><th>Created by</th>
              <th>Assigned to</th><th>Status</th><th>Created</th><th>Resolved</th>
              <th>SLA response by</th><th>SLA resolve by</th><th>SLA</th>
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
                <td class="muted">{{ t.slaResponseDueAt ? (t.slaResponseDueAt | date:'short') : '—' }}</td>
                <td class="muted">{{ t.slaResolutionDueAt ? (t.slaResolutionDueAt | date:'short') : '—' }}</td>
                <td>
                  @if (t.slaId != null) {
                    @if (t.slaBreached) {
                      <span class="sla-pill breached">BREACHED</span>
                    } @else {
                      <span class="sla-pill within">WITHIN</span>
                    }
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
                <td>
                  <button mat-icon-button [matMenuTriggerFor]="m" matTooltip="Actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #m="matMenu">
                    <button mat-menu-item (click)="viewAttachments(t.ticketId)">
                      <mat-icon>attach_file</mat-icon>View attachments
                    </button>
                    @if (auth.hasRole('ADMIN','MANAGER','NETWORK_ENGINEER') && t.status !== 'CLOSED') {
                      <button mat-menu-item (click)="openAssign(t)">
                        <mat-icon>person_add</mat-icon>{{ t.assignedToName ? 'Reassign' : 'Assign' }}
                      </button>
                    }
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
              <tr><td colspan="12" class="empty">No tickets yet.</td></tr>
            }
          </tbody>
        </table>
        </div>
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
    .scroll { overflow-x: auto; }
    .sla-pill { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
                letter-spacing: 0.05em; text-transform: uppercase; }
    .sla-pill.within   { background: var(--success-bg); color: var(--success-fg); }
    .sla-pill.breached { background: var(--danger-bg);  color: var(--danger-fg); }
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

  viewAttachments(ticketId: number) {
    this.dialog.open(AttachmentsDialogComponent, { width: '560px', data: { ticketId } });
  }

  openAssign(ticket: any) {
    const ref = this.dialog.open(AssignTicketDialogComponent, { width: '420px', data: { ticket } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Ticket reassigned', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  openCreate() {
    const ref = this.dialog.open(NewTicketDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.snack.open(`Ticket #${created.ticketId} opened`, 'OK', { duration: 3000 });
        this.refresh();
      }
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// New-ticket dialog — pick an open fault report, set priority + assignee.
// Backend auto-creates the SLA record on save.
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-new-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>confirmation_number</mat-icon> Open new incident ticket
    </h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        @if (loadingFaults()) { <mat-progress-bar mode="indeterminate" /> }

        <mat-form-field appearance="outline">
          <mat-label>Fault report</mat-label>
          <mat-select name="faultId" [(ngModel)]="model.faultId" required>
            @for (f of faults(); track f.faultId) {
              <mat-option [value]="f.faultId">
                #{{ f.faultId }} · {{ f.siteName }} · {{ f.severity }} — {{ (f.description || '') | slice:0:60 }}
              </mat-option>
            } @empty {
              <mat-option [value]="null" [disabled]="true">No open faults to escalate</mat-option>
            }
          </mat-select>
          <mat-hint>Only faults whose status is not CLOSED are listed.</mat-hint>
        </mat-form-field>

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
  `,
})
export class NewTicketDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<NewTicketDialogComponent>);
  private currentUser = inject(CurrentUserService);

  faults = signal<any[]>([]);
  assignees = signal<any[]>([]);
  loadingFaults = signal(true);
  model: any = { faultId: null, priority: 'P3', assignedToId: null };

  ngOnInit() {
    this.api.faultReports().subscribe({
      next: (f) => {
        // Only OPEN / IN_PROGRESS faults are eligible for a NEW ticket.
        // (CLOSED/RESOLVED faults won't need new work; faults that already
        // have an active ticket would be rejected by the backend, but the
        // UI doesn't pre-filter those — the error is clear if it happens.)
        this.faults.set(f.filter((x) => {
          const s = (x.status || '').toUpperCase();
          return s !== 'CLOSED' && s !== 'RESOLVED';
        }));
        this.loadingFaults.set(false);
      },
      error: () => this.loadingFaults.set(false),
    });
    // Tickets are field work -> only field engineers can be assignees.
    this.api.users().subscribe({
      next: (u) => this.assignees.set(
        u.filter((x) => x.role === 'FIELD_ENGINEER' && (x.status || '').toUpperCase() === 'ACTIVE')
      ),
    });
  }

  submit() {
    const me = this.currentUser.userId();
    if (!me) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    const body: any = { faultId: this.model.faultId, createdById: me, priority: this.model.priority };
    if (this.model.assignedToId) body.assignedToId = this.model.assignedToId;
    this.api.createTicket(body).subscribe({
      next: (created) => this.ref.close(created),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Could not open ticket', 'OK', { duration: 4000 }),
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Ticket attachments dialog — view + upload images / log dumps.
// Field engineers use this to attach proof-of-work photos.
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-attachments-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatDialogModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>attach_file</mat-icon> Attachments for ticket #{{ data.ticketId }}
    </h2>
    <mat-dialog-content>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <div class="uploader">
        <input #fileInput type="file" hidden (change)="onFile($event)"
               accept="image/*,application/pdf,.log,.txt,.zip">
        <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="uploading()">
          <mat-icon>upload_file</mat-icon> Choose file
        </button>
        <span class="fname">{{ file?.name || 'No file chosen' }}</span>
        <mat-form-field appearance="outline" class="notes">
          <mat-label>Description (optional)</mat-label>
          <input matInput [(ngModel)]="description" name="description"
                 placeholder="e.g. Splice closure C-12 after repair">
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="upload()"
                [disabled]="!file || uploading()">
          <mat-icon>cloud_upload</mat-icon> Upload
        </button>
      </div>

      @if (attachments().length) {
        <table class="dt">
          <thead>
            <tr><th>ID</th><th>Preview / File</th><th>Description</th><th>Uploaded by</th><th>When</th></tr>
          </thead>
          <tbody>
            @for (a of attachments(); track a.attachmentId) {
              <tr>
                <td class="num">{{ a.attachmentId }}</td>
                <td>
                  @if (a.previewUrl && isImage(a.fileUri)) {
                    <img [src]="a.previewUrl" class="thumb" alt="attachment" />
                  } @else {
                    <button mat-stroked-button color="primary" (click)="download(a)">
                      <mat-icon>download</mat-icon> {{ basename(a.fileUri) }}
                    </button>
                  }
                </td>
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
          <p>No attachments uploaded to this ticket yet.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .uploader { display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
                margin: 8px 0 16px; padding: 12px; background: #f8fafc;
                border: 1px solid var(--border-soft); border-radius: 6px; }
    .uploader .notes { flex: 1 1 200px; min-width: 220px; }
    .fname { font-size: 12px; color: var(--text-muted); }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 8px; }
    .dt th, .dt td { padding: 8px 10px; text-align: left;
                     border-bottom: 1px solid var(--border-soft); vertical-align: middle; }
    .dt th { font-size: 10.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;
             letter-spacing: 0.04em; background: #fafbfc; }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .muted { color: var(--text-muted); }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .empty mat-icon { font-size: 36px !important; height: 36px !important; width: 36px !important; }
    .thumb { width: 96px; height: 64px; object-fit: cover; border-radius: 4px;
             border: 1px solid var(--border-soft); }
  `,
})
export class AttachmentsDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  loading = signal(true);
  uploading = signal(false);
  attachments = signal<any[]>([]);
  file: File | null = null;
  description = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticketId: number }) {}

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.ticketAttachments(this.data.ticketId).subscribe({
      next: (a) => {
        const enriched = a.map((row) => ({ ...row }));
        // Pull image bytes so we can render an <img> thumbnail inline.
        enriched.forEach((row) => {
          if (this.isImage(row.fileUri)) {
            this.api.downloadTicketAttachment(this.data.ticketId, row.attachmentId).subscribe({
              next: (blob) => {
                row.previewUrl = window.URL.createObjectURL(blob);
                this.attachments.set([...enriched]);
              },
              error: () => { /* fall back to a download button */ },
            });
          }
        });
        this.attachments.set(enriched);
        this.loading.set(false);
      },
      error: () => { this.attachments.set([]); this.loading.set(false); },
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  upload() {
    if (!this.file) return;
    const me = this.currentUser.userId();
    if (!me) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    this.uploading.set(true);
    this.api.uploadTicketAttachmentFile(this.data.ticketId, this.file, me, this.description || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file = null; this.description = '';
        this.snack.open('Attachment uploaded', 'OK', { duration: 2500 });
        this.refresh();
      },
      error: (err: any) => {
        this.uploading.set(false);
        this.snack.open(err?.error?.message ?? 'Upload failed', 'OK', { duration: 4000 });
      },
    });
  }

  download(a: any) {
    this.api.downloadTicketAttachment(this.data.ticketId, a.attachmentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.basename(a.fileUri);
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Download failed', 'OK', { duration: 3000 }),
    });
  }

  isImage(uri: string): boolean {
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(uri || '');
  }

  basename(uri: string): string {
    if (!uri) return '—';
    const parts = uri.split(/[\\/]/);
    return parts[parts.length - 1];
  }
}

// ────────────────────────────────────────────────────────────────────────
// Assign / reassign an existing ticket
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-assign-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_add</mat-icon>
      {{ data.ticket.assignedToName ? 'Reassign' : 'Assign' }} ticket #{{ data.ticket.ticketId }}
    </h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        @if (data.ticket.assignedToName) {
          <p class="muted">Currently assigned to <strong>{{ data.ticket.assignedToName }}</strong>.</p>
        }
        <mat-form-field appearance="outline">
          <mat-label>Assign to</mat-label>
          <mat-select name="assignedToId" [(ngModel)]="assignedToId" required>
            @for (u of assignees(); track u.userId) {
              <mat-option [value]="u.userId">{{ u.name || u.email }} — {{ u.role }}</mat-option>
            }
          </mat-select>
          <mat-hint>Tickets can only be assigned to a field engineer</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">Assign</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .col { display: flex; flex-direction: column; gap: 6px; padding-top: 12px !important; }
    .muted { color: var(--text-muted); font-size: 12px; margin: 0 0 6px; }
  `,
})
export class AssignTicketDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<AssignTicketDialogComponent>);

  assignees = signal<any[]>([]);
  assignedToId: number | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticket: any }) {}

  ngOnInit() {
    // Only ACTIVE field engineers can hold a ticket.
    this.api.users().subscribe({
      next: (u) => this.assignees.set(
        u.filter((x) => x.role === 'FIELD_ENGINEER' && (x.status || '').toUpperCase() === 'ACTIVE')
      ),
    });
  }

  submit() {
    if (!this.assignedToId) return;
    this.api.assignTicket(this.data.ticket.ticketId, this.assignedToId).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Assign failed', 'OK', { duration: 4000 }),
    });
  }
}

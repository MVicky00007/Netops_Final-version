import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-capacity-plans-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatMenuModule, MatProgressBarModule, MatTooltipModule,
  ],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Capacity plans</h1>
          <p class="muted">Proposed capacity changes — submit, review, approve</p>
        </div>
        @if (auth.hasRole('ADMIN','MANAGER','NETWORK_ENGINEER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> Submit new plan
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Site</th><th>Current (Mbps)</th><th>Proposed (Mbps)</th>
              <th>Reason</th><th>Requested by</th><th>Status</th><th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of rows(); track p.planId) {
              <tr>
                <td>{{ p.planId }}</td>
                <td>{{ p.siteName || '—' }}</td>
                <td class="num">{{ p.currentCapacity }}</td>
                <td class="num">{{ p.proposedCapacity }}</td>
                <td>{{ p.reason }}</td>
                <td>{{ p.requestedByName || '—' }}</td>
                <td><span class="pill" [class]="'pill-' + (p.status || '').toLowerCase()">{{ p.status }}</span></td>
                <td class="muted">{{ p.requestedAt | date:'short' }}</td>
                <td class="actions-cell">
                  <button mat-icon-button (click)="openEvidence(p)" matTooltip="Evidence files">
                    <mat-icon>folder_open</mat-icon>
                  </button>
                  @if (auth.hasRole('ADMIN','MANAGER') && p.status === 'PENDING') {
                    <button mat-stroked-button color="primary" class="act act-approve"
                            (click)="openDecision(p, 'APPROVED')">
                      <mat-icon>check_circle</mat-icon> Approve
                    </button>
                    <button mat-stroked-button color="warn" class="act act-reject"
                            (click)="openDecision(p, 'REJECTED')">
                      <mat-icon>cancel</mat-icon> Reject
                    </button>
                  } @else if (p.status !== 'PENDING') {
                    <span class="faint">no action</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">No capacity plans yet.</td></tr>
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
    .faint { color: var(--text-faint); }

    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px;
             overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left;
                     border-bottom: 1px solid var(--border-soft); white-space: nowrap; }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase;
             letter-spacing: 0.04em; color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }

    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px;
            border-radius: 4px; letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-approved  { background: var(--success-bg); color: var(--success-fg); }
    .pill-pending, .pill-draft { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-rejected  { background: var(--danger-bg); color: var(--danger-fg); }
    .pill-implemented { background: var(--info-bg); color: var(--info-fg); }

    .actions-cell { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .act { line-height: 28px; min-height: 32px; padding: 0 10px; font-size: 12px; }
    .act mat-icon { font-size: 16px !important; height: 16px !important; width: 16px !important;
                    margin-right: 2px; vertical-align: middle; }
  `,
})
export class CapacityPlansListComponent implements OnInit {
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
    this.api.capacityPlans().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(CapacityPlanFormDialog, {
      width: '480px',
      data: { userId: this.currentUser.userId() },
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.snack.open('Plan submitted', 'OK', { duration: 2500 });
        this.refresh();
      }
    });
  }

  openEvidence(plan: any) {
    this.dialog.open(PlanEvidenceDialog, { width: '640px', data: { plan } });
  }

  /**
   * Open the review dialog for the given plan. The dialog asks the manager
   * for comments (mandatory on REJECT, optional on APPROVE) and then submits
   * to POST /capacity-plans/{id}/approve with the chosen status.
   */
  openDecision(plan: any, decision: 'APPROVED' | 'REJECTED') {
    const approverId = this.currentUser.userId();
    if (!approverId) {
      this.snack.open('Could not resolve your user id', 'OK', { duration: 3000 });
      return;
    }
    const ref = this.dialog.open(ReviewPlanDialog, {
      width: '500px',
      data: { plan, decision, approverId },
    });
    ref.afterClosed().subscribe((done) => {
      if (done) {
        this.snack.open(
          `Plan #${plan.planId} ${decision === 'APPROVED' ? 'approved' : 'rejected'}`,
          'OK', { duration: 2500 });
        this.refresh();
      }
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Approve / Reject capacity plan dialog (manager workflow)
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-review-plan-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title [class.approve]="data.decision === 'APPROVED'"
                         [class.reject]="data.decision === 'REJECTED'">
      <mat-icon>{{ data.decision === 'APPROVED' ? 'check_circle' : 'cancel' }}</mat-icon>
      {{ data.decision === 'APPROVED' ? 'Approve' : 'Reject' }} plan #{{ data.plan.planId }}
    </h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        <div class="summary">
          <div><span class="lbl">Site</span><strong>{{ data.plan.siteName || '—' }}</strong></div>
          <div><span class="lbl">Current</span>{{ data.plan.currentCapacity }} Mbps</div>
          <div><span class="lbl">Proposed</span>{{ data.plan.proposedCapacity }} Mbps</div>
          <div><span class="lbl">Requested by</span>{{ data.plan.requestedByName || '—' }}</div>
          <div class="full"><span class="lbl">Reason</span>{{ data.plan.reason }}</div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>{{ data.decision === 'APPROVED' ? 'Approval comments (optional)' : 'Reason for rejection' }}</mat-label>
          <textarea matInput rows="3" name="comments" [(ngModel)]="comments"
                    [required]="data.decision === 'REJECTED'"
                    [placeholder]="data.decision === 'APPROVED'
                      ? 'e.g. Traffic data justifies upgrade. Proceed with vendor scheduling.'
                      : 'e.g. Insufficient evidence. Re-submit with MRTG dump for last quarter.'"></textarea>
          <mat-hint>{{ data.decision === 'REJECTED'
                       ? 'A clear reason helps the requester address the gap.'
                       : 'Optional — leave blank for a straight approval.' }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button type="submit"
                [color]="data.decision === 'APPROVED' ? 'primary' : 'warn'"
                [disabled]="!f.form.valid || submitting()">
          <mat-icon>{{ data.decision === 'APPROVED' ? 'check_circle' : 'cancel' }}</mat-icon>
          Confirm {{ data.decision === 'APPROVED' ? 'approval' : 'rejection' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    h2.approve mat-icon { color: var(--success-fg) !important; }
    h2.reject  mat-icon { color: var(--danger-fg) !important; }
    .col { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px;
               padding: 12px 14px; background: #f8fafc; border-radius: 6px;
               border: 1px solid var(--border-soft); margin-bottom: 12px; font-size: 12.5px; }
    .summary .full { grid-column: span 2; }
    .summary .lbl { display: block; font-size: 10.5px; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.04em;
                    color: var(--text-muted); margin-bottom: 2px; }
  `,
})
export class ReviewPlanDialog {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<ReviewPlanDialog>);

  comments = '';
  submitting = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    plan: any;
    decision: 'APPROVED' | 'REJECTED';
    approverId: number;
  }) {}

  submit() {
    this.submitting.set(true);
    this.api.approveCapacityPlan(this.data.plan.planId, {
      approvedBy: this.data.approverId,
      status:     this.data.decision,
      comments:   this.comments.trim() ||
                  (this.data.decision === 'APPROVED' ? 'Approved.' : 'Rejected.'),
    }).subscribe({
      next: () => { this.submitting.set(false); this.ref.close(true); },
      error: (err: any) => {
        this.submitting.set(false);
        this.snack.open(err?.error?.message ?? 'Decision failed', 'OK', { duration: 4000 });
      },
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Submit-plan dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-capacity-plan-form-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Submit capacity plan</h2>
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
          <mat-label>Node</mat-label>
          <mat-select name="nodeId" [(ngModel)]="selectedNodeId" (selectionChange)="onNodeChange($event.value)"
                      [disabled]="!model.siteId || !nodes().length" required>
            @for (n of nodes(); track n.nodeId) {
              <mat-option [value]="n.nodeId">{{ n.hostname }}</mat-option>
            }
          </mat-select>
          @if (model.siteId && !nodes().length) { <mat-hint>No nodes at this site</mat-hint> }
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Interface</mat-label>
          <mat-select name="interfaceId" [(ngModel)]="model.interfaceId"
                      [disabled]="!selectedNodeId || !interfaces().length" required>
            @for (i of interfaces(); track i.interfaceId) {
              <mat-option [value]="i.interfaceId">{{ i.name }} ({{ i.capacityMbps }} Mbps)</mat-option>
            }
          </mat-select>
          @if (selectedNodeId && !interfaces().length) { <mat-hint>No interfaces on this node</mat-hint> }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Current capacity (Mbps)</mat-label>
          <input matInput type="number" name="currentCapacity" [(ngModel)]="model.currentCapacity" required min="0">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Proposed capacity (Mbps)</mat-label>
          <input matInput type="number" name="proposedCapacity" [(ngModel)]="model.proposedCapacity" required min="0">
        </mat-form-field>
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Reason</mat-label>
          <textarea matInput rows="3" name="reason" [(ngModel)]="model.reason" required
                    placeholder="Why is this capacity change needed?"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">Submit plan</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 12px !important; }
    .col-span-2 { grid-column: span 2; }
  `,
})
export class CapacityPlanFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<CapacityPlanFormDialog>);
  private currentUser = inject(CurrentUserService);

  model = {
    siteId: null as number | null,
    interfaceId: null as number | null,
    currentCapacity: null as number | null,
    proposedCapacity: null as number | null,
    reason: '',
  };

  // Node is just a UI helper to filter the interface dropdown — not sent to backend.
  selectedNodeId: number | null = null;

  sites      = signal<any[]>([]);
  nodes      = signal<any[]>([]);
  interfaces = signal<any[]>([]);

  ngOnInit() {
    this.api.sites().subscribe({
      next: (s) => this.sites.set(s),
      error: () => this.snack.open('Could not load sites', 'OK', { duration: 3000 }),
    });
  }

  onSiteChange(siteId: number | null) {
    this.selectedNodeId = null;
    this.model.interfaceId = null;
    this.nodes.set([]);
    this.interfaces.set([]);
    if (!siteId) return;
    this.api.nodesBySite(siteId).subscribe({
      next: (n) => this.nodes.set(n),
      error: () => this.nodes.set([]),
    });
  }

  onNodeChange(nodeId: number | null) {
    this.model.interfaceId = null;
    this.interfaces.set([]);
    if (!nodeId) return;
    this.api.interfacesByNode(nodeId).subscribe({
      next: (i) => this.interfaces.set(i),
      error: () => this.interfaces.set([]),
    });
  }

  submit() {
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved yet — try again', 'OK', { duration: 3000 }); return; }
    this.api.createCapacityPlan({ ...this.model, requestedBy: userId }).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Submission failed', 'OK', { duration: 4000 }),
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Evidence files viewer / uploader for a capacity plan
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-plan-evidence-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>folder_open</mat-icon> Evidence for plan #{{ data.plan.planId }}
    </h2>
    <mat-dialog-content>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (auth.hasRole('ADMIN','MANAGER','NETWORK_ENGINEER')) {
        <div class="uploader">
          <input #fileInput type="file" hidden (change)="onFile($event)">
          <button mat-stroked-button type="button" (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon> Choose file
          </button>
          <span class="fname">{{ file?.name || 'No file chosen' }}</span>
          <mat-form-field appearance="outline" class="notes">
            <mat-label>Notes (optional)</mat-label>
            <input matInput [(ngModel)]="notes" name="notes">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="upload()" [disabled]="!file || uploading()">
            <mat-icon>cloud_upload</mat-icon> Upload
          </button>
        </div>
      }

      @if (items().length) {
        <table class="dt">
          <thead><tr><th>ID</th><th>File</th><th>Notes</th><th>Uploaded by</th><th>When</th><th></th></tr></thead>
          <tbody>
            @for (e of items(); track e.evidenceId) {
              <tr>
                <td class="num">{{ e.evidenceId }}</td>
                <td><strong>{{ e.fileName || ('Evidence ' + e.evidenceId) }}</strong></td>
                <td>{{ e.notes || '—' }}</td>
                <td>{{ e.uploadedByName || '—' }}</td>
                <td class="muted">{{ e.uploadedAt | date:'short' }}</td>
                <td>
                  <button mat-icon-button (click)="download(e)" matTooltip="Download">
                    <mat-icon>download</mat-icon>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (!loading()) {
        <div class="empty"><mat-icon>cloud_off</mat-icon><p>No evidence uploaded for this plan.</p></div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .uploader { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 8px 0 16px; }
    .uploader .notes { flex: 1 1 200px; }
    .fname { font-size: 12px; color: var(--text-muted); }
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
export class PlanEvidenceDialog implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  items = signal<any[]>([]);
  loading = signal(true);
  uploading = signal(false);
  file: File | null = null;
  notes = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { plan: any }) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.planEvidence(this.data.plan.planId).subscribe({
      next: (r) => { this.items.set(r); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); },
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  upload() {
    if (!this.file) return;
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.uploading.set(true);
    this.api.uploadPlanEvidence(this.data.plan.planId, this.file, userId, this.notes || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file = null; this.notes = '';
        this.snack.open('Evidence uploaded', 'OK', { duration: 2500 });
        this.refresh();
      },
      error: (err: any) => {
        this.uploading.set(false);
        this.snack.open(err?.error?.message ?? 'Upload failed', 'OK', { duration: 4000 });
      },
    });
  }

  download(e: any) {
    this.api.downloadPlanEvidence(this.data.plan.planId, e.evidenceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = e.fileName || `evidence-${e.evidenceId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Download failed', 'OK', { duration: 3000 }),
    });
  }
}

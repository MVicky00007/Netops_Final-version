import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    MatInputModule, MatSelectModule, MatMenuModule, MatProgressBarModule,
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
              @if (auth.hasRole('ADMIN','MANAGER')) { <th>Actions</th> }
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
                @if (auth.hasRole('ADMIN','MANAGER')) {
                  <td>
                    @if (p.status === 'PENDING') {
                      <button mat-icon-button color="primary" (click)="decide(p.planId, 'APPROVED')"
                              matTooltip="Approve"><mat-icon>check_circle</mat-icon></button>
                      <button mat-icon-button color="warn" (click)="decide(p.planId, 'REJECTED')"
                              matTooltip="Reject"><mat-icon>cancel</mat-icon></button>
                    } @else { <span class="faint">—</span> }
                  </td>
                }
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

  decide(planId: number, status: 'APPROVED' | 'REJECTED') {
    const approverId = this.currentUser.userId();
    if (!approverId) { this.snack.open('Could not resolve your user id', 'OK', { duration: 3000 }); return; }
    this.api.approveCapacityPlan(planId, {
      approvedBy: approverId, status, comments: status === 'APPROVED' ? 'Approved.' : 'Rejected.',
    }).subscribe({
      next: () => { this.snack.open(`Plan ${status.toLowerCase()}`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? `Action failed`, 'OK', { duration: 4000 }),
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
          <mat-label>Site ID</mat-label>
          <input matInput type="number" name="siteId" [(ngModel)]="model.siteId" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Interface ID</mat-label>
          <input matInput type="number" name="interfaceId" [(ngModel)]="model.interfaceId" required>
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
          <textarea matInput rows="3" name="reason" [(ngModel)]="model.reason" required></textarea>
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
export class CapacityPlanFormDialog {
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

  submit() {
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved yet — try again', 'OK', { duration: 3000 }); return; }
    this.api.createCapacityPlan({ ...this.model, requestedBy: userId }).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Submission failed', 'OK', { duration: 4000 }),
    });
  }
}

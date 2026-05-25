import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-health-checks-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule,
    MatTooltipModule, MatButtonToggleModule, MatDialogModule,
  ],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Health checks</h1>
          <p class="muted">Automated probes monitoring the network</p>
        </div>
        <div class="hdr-actions">
          <mat-button-toggle-group [(ngModel)]="filter" (change)="load()">
            <mat-button-toggle value="all">All</mat-button-toggle>
            <mat-button-toggle value="active">Active only</mat-button-toggle>
          </mat-button-toggle-group>
          @if (auth.hasRole('ADMIN','NETWORK_ENGINEER')) {
            <button mat-flat-button color="primary" (click)="openForm()">
              <mat-icon>add</mat-icon> New check
            </button>
          }
        </div>
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Target</th><th>Condition</th>
              <th>Created by</th><th>Active</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (h of rows(); track h.checkId) {
              <tr>
                <td class="num">{{ h.checkId }}</td>
                <td><strong>{{ h.name }}</strong></td>
                <td>{{ h.targetType }}</td>
                <td>{{ h.conditionText }}</td>
                <td>{{ h.createdByName || '—' }}</td>
                <td>
                  @if (h.active) { <mat-icon class="ok">check_circle</mat-icon> }
                  @else { <mat-icon class="off">remove_circle_outline</mat-icon> }
                </td>
                <td>
                  <button mat-icon-button [matMenuTriggerFor]="m">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #m="matMenu">
                    @if (auth.hasRole('ADMIN','NETWORK_ENGINEER')) {
                      <button mat-menu-item (click)="run(h)"><mat-icon>play_arrow</mat-icon>Run now</button>
                      <button mat-menu-item (click)="openForm(h)"><mat-icon>edit</mat-icon>Edit</button>
                    }
                    <button mat-menu-item (click)="viewRuns(h)"><mat-icon>history</mat-icon>View runs</button>
                  </mat-menu>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">No health checks defined.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .hdr-actions { display: flex; gap: 12px; align-items: center; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0; }
    .hdr p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
    .muted { color: var(--text-muted); }
    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .ok { color: var(--success-fg) !important; font-size: 18px !important; }
    .off { color: var(--text-faint) !important; font-size: 18px !important; }
  `,
})
export class HealthChecksListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  rows = signal<any[]>([]);
  loading = signal(true);
  filter: 'all' | 'active' = 'all';

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.load();
  }

  load() {
    this.loading.set(true);
    const obs = this.filter === 'active' ? this.api.activeHealthChecks() : this.api.healthChecks();
    obs.subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(check?: any) {
    const ref = this.dialog.open(HealthCheckFormDialog, { width: '480px', data: { check: check ?? null } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open(check ? 'Updated' : 'Created', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  run(check: any) {
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.api.runHealthCheck({ checkId: check.checkId, executedBy: userId }).subscribe({
      next: (r: any) => this.snack.open(`Run completed: ${r?.result ?? 'OK'}`, 'OK', { duration: 3000 }),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Run failed', 'OK', { duration: 4000 }),
    });
  }

  viewRuns(check: any) {
    this.dialog.open(HealthCheckRunsDialog, { width: '720px', data: { check } });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Create/Edit health-check
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-health-check-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.check ? 'Edit health check' : 'Create health check' }}</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput name="name" [(ngModel)]="model.name" required>
        </mat-form-field>

        <div class="row2">
          <mat-form-field appearance="outline">
            <mat-label>Target type</mat-label>
            <mat-select name="targetType" [(ngModel)]="model.targetType" required>
              <mat-option value="NODE">NODE</mat-option>
              <mat-option value="INTERFACE">INTERFACE</mat-option>
              <mat-option value="SITE">SITE</mat-option>
              <mat-option value="SERVICE">SERVICE</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Target ID</mat-label>
            <input matInput type="number" name="targetId" [(ngModel)]="model.targetId">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Condition text</mat-label>
          <input matInput name="conditionText" [(ngModel)]="model.conditionText"
                 placeholder="e.g. ping latency < 200ms">
        </mat-form-field>

        <mat-checkbox name="active" [(ngModel)]="model.active">Active</mat-checkbox>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">
          {{ data.check ? 'Save' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .col { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  `,
})
export class HealthCheckFormDialog {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<HealthCheckFormDialog>);
  private currentUser = inject(CurrentUserService);

  model: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { check: any | null }) {
    this.model = data.check
      ? { ...data.check }
      : { name: '', targetType: 'NODE', targetId: null, conditionText: '', active: true };
  }

  submit() {
    if (!this.data.check) {
      this.model.createdBy = this.currentUser.userId();
    }
    const op = this.data.check
      ? this.api.updateHealthCheck(this.data.check.checkId, this.model)
      : this.api.createHealthCheck(this.model);
    op.subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Save failed', 'OK', { duration: 4000 }),
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Runs history dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-health-check-runs-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>history</mat-icon> Runs for "{{ data.check.name }}"
    </h2>
    <mat-dialog-content>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (runs().length) {
        <table class="dt">
          <thead><tr><th>Run ID</th><th>Result</th><th>Details</th><th>Executed by</th><th>When</th></tr></thead>
          <tbody>
            @for (r of runs(); track r.runId) {
              <tr>
                <td class="num">{{ r.runId }}</td>
                <td><span class="pill" [class]="'pill-' + (r.result || '').toLowerCase()">{{ r.result }}</span></td>
                <td>{{ r.details || '—' }}</td>
                <td>{{ r.executedByName || '—' }}</td>
                <td class="muted">{{ r.executedAt | date:'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (!loading()) {
        <div class="empty"><mat-icon>history_toggle_off</mat-icon><p>No runs recorded for this check.</p></div>
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
    .pill { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.05em; text-transform: uppercase; }
    .pill-pass, .pill-ok, .pill-success { background: var(--success-bg); color: var(--success-fg); }
    .pill-fail, .pill-error { background: var(--danger-bg); color: var(--danger-fg); }
    .pill-warn, .pill-warning { background: var(--warn-bg); color: var(--warn-fg); }
  `,
})
export class HealthCheckRunsDialog implements OnInit {
  private api = inject(ApiService);
  runs = signal<any[]>([]);
  loading = signal(true);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { check: any }) {}

  ngOnInit() {
    this.api.healthCheckRuns(this.data.check.checkId).subscribe({
      next: (r) => { this.runs.set(r); this.loading.set(false); },
      error: () => { this.runs.set([]); this.loading.set(false); },
    });
  }
}

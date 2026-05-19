import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-kpis-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule, MatProgressBarModule],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>KPIs</h1>
          <p class="muted">Tracked service-quality metrics</p>
        </div>
        @if (auth.hasRole('ADMIN','MANAGER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> New KPI
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Definition</th><th>Target</th><th>Current</th><th>Period</th></tr>
          </thead>
          <tbody>
            @for (k of rows(); track k.kpiId) {
              <tr>
                <td>{{ k.kpiId }}</td>
                <td><strong>{{ k.name }}</strong></td>
                <td>{{ k.definition }}</td>
                <td class="num">{{ k.targetValue }}</td>
                <td class="num" [class.good]="k.currentValue >= k.targetValue">{{ k.currentValue }}</td>
                <td>{{ k.reportingPeriod }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No KPIs yet.</td></tr>
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
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .good { color: var(--success-fg); }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
  `,
})
export class KpisListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.kpis().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(KpiFormDialog, { width: '420px' });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('KPI created', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

@Component({
  selector: 'app-kpi-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Create KPI</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput name="name" [(ngModel)]="model.name" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Definition</mat-label>
          <input matInput name="definition" [(ngModel)]="model.definition">
        </mat-form-field>
        <div class="row2">
          <mat-form-field appearance="outline">
            <mat-label>Target</mat-label>
            <input matInput type="number" step="0.01" name="targetValue" [(ngModel)]="model.targetValue">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Current</mat-label>
            <input matInput type="number" step="0.01" name="currentValue" [(ngModel)]="model.currentValue">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Reporting period</mat-label>
          <mat-select name="reportingPeriod" [(ngModel)]="model.reportingPeriod">
            <mat-option value="DAILY">DAILY</mat-option>
            <mat-option value="WEEKLY">WEEKLY</mat-option>
            <mat-option value="MONTHLY">MONTHLY</mat-option>
            <mat-option value="QUARTERLY">QUARTERLY</mat-option>
            <mat-option value="ANNUAL">ANNUAL</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">Create</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .col { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  `,
})
export class KpiFormDialog {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<KpiFormDialog>);

  model: any = { name: '', definition: '', targetValue: null, currentValue: null, reportingPeriod: 'MONTHLY' };

  submit() {
    this.api.createKpi(this.model).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Creation failed', 'OK', { duration: 4000 }),
    });
  }
}

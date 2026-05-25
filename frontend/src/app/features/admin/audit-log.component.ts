import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule,
  ],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Audit log</h1>
          <p class="muted">Tamper-evident record of every audited action</p>
        </div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline" class="sm">
          <mat-label>Filter by</mat-label>
          <mat-select [(ngModel)]="filter.kind" (selectionChange)="reset()">
            <mat-option value="all">All entries</mat-option>
            <mat-option value="user">By user</mat-option>
            <mat-option value="resource">By resource type</mat-option>
            <mat-option value="action">By action</mat-option>
          </mat-select>
        </mat-form-field>

        @if (filter.kind === 'user') {
          <mat-form-field appearance="outline" class="sm">
            <mat-label>User</mat-label>
            <mat-select [(ngModel)]="filter.value">
              @for (u of users(); track u.userId) {
                <mat-option [value]="u.userId">{{ u.username }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        @if (filter.kind === 'resource') {
          <mat-form-field appearance="outline" class="sm">
            <mat-label>Resource type</mat-label>
            <mat-select [(ngModel)]="filter.value">
              <mat-option value="SITE">SITE</mat-option>
              <mat-option value="NODE">NODE</mat-option>
              <mat-option value="INTERFACE">INTERFACE</mat-option>
              <mat-option value="TICKET">TICKET</mat-option>
              <mat-option value="FAULT">FAULT</mat-option>
              <mat-option value="PLAN">PLAN</mat-option>
              <mat-option value="USER">USER</mat-option>
              <mat-option value="KPI">KPI</mat-option>
              <mat-option value="REPORT">REPORT</mat-option>
            </mat-select>
          </mat-form-field>
        }
        @if (filter.kind === 'action') {
          <mat-form-field appearance="outline" class="sm">
            <mat-label>Action</mat-label>
            <mat-select [(ngModel)]="filter.value">
              <mat-option value="CREATE">CREATE</mat-option>
              <mat-option value="UPDATE">UPDATE</mat-option>
              <mat-option value="DELETE">DELETE</mat-option>
              <mat-option value="LOGIN">LOGIN</mat-option>
              <mat-option value="APPROVE">APPROVE</mat-option>
              <mat-option value="REJECT">REJECT</mat-option>
            </mat-select>
          </mat-form-field>
        }
        @if (filter.kind !== 'all') {
          <button mat-stroked-button (click)="apply()" [disabled]="!filter.value">
            <mat-icon>filter_alt</mat-icon> Apply
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr><th>ID</th><th>User</th><th>Action</th><th>Resource</th><th>Resource ID</th><th>Details</th><th>When</th></tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.auditId) {
              <tr>
                <td class="num">{{ r.auditId }}</td>
                <td>{{ r.userName || r.userId }}</td>
                <td><span class="pill" [class]="'pill-' + (r.action || '').toLowerCase()">{{ r.action }}</span></td>
                <td>{{ r.resourceType }}</td>
                <td class="num">{{ r.resourceId }}</td>
                <td class="muted">{{ r.details }}</td>
                <td class="muted">{{ r.timestamp | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">No audit entries match this filter.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0 0 2px; }
    .hdr p { font-size: 12px; color: var(--text-muted); margin: 0 0 16px; }
    .muted { color: var(--text-muted); }
    .filters { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
    .filters mat-form-field.sm { width: 220px; }
    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .num { font-variant-numeric: tabular-nums; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-create, .pill-approve, .pill-login { background: var(--success-bg); color: var(--success-fg); }
    .pill-update { background: var(--info-bg); color: var(--info-fg); }
    .pill-delete, .pill-reject { background: var(--danger-bg); color: var(--danger-fg); }
  `,
})
export class AuditLogComponent implements OnInit {
  private api = inject(ApiService);

  rows = signal<any[]>([]);
  users = signal<any[]>([]);
  loading = signal(true);
  filter: { kind: 'all' | 'user' | 'resource' | 'action'; value: any } = { kind: 'all', value: null };

  ngOnInit() {
    this.api.users().subscribe((u) => this.users.set(u));
    this.loadAll();
  }

  reset() { this.filter.value = null; if (this.filter.kind === 'all') this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.api.auditLogs().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  apply() {
    if (!this.filter.value) return;
    this.loading.set(true);
    const obs =
      this.filter.kind === 'user'     ? this.api.auditLogsByUser(this.filter.value) :
      this.filter.kind === 'resource' ? this.api.auditLogsByResource(this.filter.value) :
      this.filter.kind === 'action'   ? this.api.auditLogsByAction(this.filter.value) :
                                        this.api.auditLogs();
    obs.subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-nodes-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Edge nodes</h1>
          <p class="muted">Routers and switches across all sites</p>
        </div>
        @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> New node
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Hostname</th><th>Site</th><th>Model</th>
              <th>Serial</th><th>Status</th><th>Installed</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (n of rows(); track n.nodeId) {
              <tr>
                <td class="num">{{ n.nodeId }}</td>
                <td><strong>{{ n.hostname }}</strong></td>
                <td>{{ n.siteName || '—' }}</td>
                <td>{{ n.model || '—' }}</td>
                <td class="muted">{{ n.serialNumber || '—' }}</td>
                <td><span class="pill" [class]="'pill-' + (n.status || '').toLowerCase()">{{ n.status }}</span></td>
                <td class="muted">{{ n.installedAt | date:'mediumDate' }}</td>
                <td>
                  @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER')) {
                    <button mat-icon-button (click)="openEdit(n)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">No nodes yet.</td></tr>
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
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-active, .pill-online { background: var(--success-bg); color: var(--success-fg); }
    .pill-maintenance { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-inactive, .pill-offline { background: var(--danger-bg); color: var(--danger-fg); }
  `,
})
export class NodesListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.nodes().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(NodeFormDialog, { width: '480px', data: { node: null } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Node created', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  openEdit(node: any) {
    const ref = this.dialog.open(NodeFormDialog, { width: '480px', data: { node } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Node updated', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Create/Edit node dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-node-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.node ? 'Edit node' : 'Create node' }}</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="grid">
        @if (!data.node) {
          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Site</mat-label>
            <mat-select name="siteId" [(ngModel)]="siteId" required>
              @for (s of sites(); track s.siteId) {
                <mat-option [value]="s.siteId">{{ s.siteCode }} — {{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>Hostname</mat-label>
          <input matInput name="hostname" [(ngModel)]="model.hostname" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select name="status" [(ngModel)]="model.status" required>
            <mat-option value="ACTIVE">ACTIVE</mat-option>
            <mat-option value="MAINTENANCE">MAINTENANCE</mat-option>
            <mat-option value="INACTIVE">INACTIVE</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Model</mat-label>
          <input matInput name="model" [(ngModel)]="model.model">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Serial number</mat-label>
          <input matInput name="serialNumber" [(ngModel)]="model.serialNumber">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Management IP</mat-label>
          <input matInput name="managementIp" [(ngModel)]="model.managementIp">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Installed at</mat-label>
          <input matInput type="date" name="installedAt" [(ngModel)]="model.installedAt">
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">
          {{ data.node ? 'Save' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 12px !important; }
    .col-span-2 { grid-column: span 2; }
  `,
})
export class NodeFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<NodeFormDialog>);

  sites = signal<any[]>([]);
  siteId: number | null = null;
  model: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { node: any | null }) {
    this.model = data.node
      ? { ...data.node, installedAt: data.node.installedAt?.substring(0, 10) }
      : { hostname: '', model: '', serialNumber: '', managementIp: '', status: 'ACTIVE', installedAt: '' };
  }

  ngOnInit() {
    if (!this.data.node) {
      this.api.sites().subscribe((s) => this.sites.set(s));
    }
  }

  submit() {
    const op = this.data.node
      ? this.api.updateNode(this.data.node.nodeId, this.model)
      : this.api.createNode(this.siteId!, this.model);
    op.subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Save failed', 'OK', { duration: 4000 }),
    });
  }
}

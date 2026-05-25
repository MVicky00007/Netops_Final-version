import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-interfaces-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Interfaces</h1>
          <p class="muted">All network interfaces across every edge node</p>
        </div>
        @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> New interface
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Interface</th><th>Node</th><th>Site</th>
              <th>Type</th><th>Capacity (Mbps)</th><th>Admin</th><th>Oper</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (i of rows(); track i.interfaceId) {
              <tr>
                <td class="num">{{ i.interfaceId }}</td>
                <td><strong>{{ i.name }}</strong></td>
                <td>{{ i.nodeHostname || '—' }}</td>
                <td>{{ i.siteName || '—' }}</td>
                <td>{{ i.type || '—' }}</td>
                <td class="num">{{ i.capacityMbps }}</td>
                <td><span class="pill" [class]="'pill-' + (i.adminStatus || '').toLowerCase()">{{ i.adminStatus }}</span></td>
                <td><span class="pill" [class]="'pill-' + (i.operStatus || '').toLowerCase()">{{ i.operStatus }}</span></td>
                <td>
                  @if (auth.hasRole('ADMIN','NETWORK_ENGINEER','FIELD_ENGINEER')) {
                    <button mat-icon-button (click)="openEdit(i)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">No interfaces yet.</td></tr>
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
    .pill-up, .pill-online { background: var(--success-bg); color: var(--success-fg); }
    .pill-testing, .pill-degraded { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-down, .pill-offline { background: var(--danger-bg); color: var(--danger-fg); }
  `,
})
export class InterfacesListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.interfaces().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(InterfaceFormDialog, { width: '480px', data: { iface: null } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Interface created', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  openEdit(iface: any) {
    const ref = this.dialog.open(InterfaceFormDialog, { width: '480px', data: { iface } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Interface updated', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

@Component({
  selector: 'app-interface-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.iface ? 'Edit interface' : 'Create interface' }}</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="grid">
        @if (!data.iface) {
          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Site</mat-label>
            <mat-select [(ngModel)]="siteId" name="siteId" (selectionChange)="onSite($event.value)" required>
              @for (s of sites(); track s.siteId) {
                <mat-option [value]="s.siteId">{{ s.siteCode }} — {{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Node</mat-label>
            <mat-select [(ngModel)]="nodeId" name="nodeId" [disabled]="!siteId" required>
              @for (n of nodes(); track n.nodeId) {
                <mat-option [value]="n.nodeId">{{ n.hostname }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>Name (e.g. Gi0/1)</mat-label>
          <input matInput name="name" [(ngModel)]="model.name" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select name="type" [(ngModel)]="model.type">
            <mat-option value="ETHERNET">ETHERNET</mat-option>
            <mat-option value="FIBER">FIBER</mat-option>
            <mat-option value="LAG">LAG</mat-option>
            <mat-option value="VLAN">VLAN</mat-option>
            <mat-option value="OTHER">OTHER</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Capacity (Mbps)</mat-label>
          <input matInput type="number" name="capacityMbps" [(ngModel)]="model.capacityMbps" min="0">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>IP address</mat-label>
          <input matInput name="ipAddress" [(ngModel)]="model.ipAddress">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Admin status</mat-label>
          <mat-select name="adminStatus" [(ngModel)]="model.adminStatus">
            <mat-option value="UP">UP</mat-option>
            <mat-option value="DOWN">DOWN</mat-option>
            <mat-option value="TESTING">TESTING</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Oper status</mat-label>
          <mat-select name="operStatus" [(ngModel)]="model.operStatus">
            <mat-option value="UP">UP</mat-option>
            <mat-option value="DOWN">DOWN</mat-option>
            <mat-option value="TESTING">TESTING</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">
          {{ data.iface ? 'Save' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 12px !important; }
    .col-span-2 { grid-column: span 2; }
  `,
})
export class InterfaceFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<InterfaceFormDialog>);

  sites = signal<any[]>([]);
  nodes = signal<any[]>([]);
  siteId: number | null = null;
  nodeId: number | null = null;
  model: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { iface: any | null }) {
    this.model = data.iface
      ? { ...data.iface }
      : { name: '', type: 'ETHERNET', capacityMbps: 1000, ipAddress: '', adminStatus: 'UP', operStatus: 'UP' };
  }

  ngOnInit() {
    if (!this.data.iface) this.api.sites().subscribe((s) => this.sites.set(s));
  }

  onSite(siteId: number) {
    this.nodeId = null;
    this.nodes.set([]);
    if (siteId) this.api.nodesBySite(siteId).subscribe((n) => this.nodes.set(n));
  }

  submit() {
    const op = this.data.iface
      ? this.api.updateInterface(this.data.iface.interfaceId, this.model)
      : this.api.createInterface(this.nodeId!, this.model);
    op.subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Save failed', 'OK', { duration: 4000 }),
    });
  }
}

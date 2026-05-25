import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-capacity-records-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule,
            MatButtonModule, MatIconModule, MatDialogModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Capacity records</h1>
          <p class="muted">Measured throughput per interface</p>
        </div>
        @if (auth.hasRole('ADMIN','NETWORK_ENGINEER')) {
          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> Record measurement
          </button>
        }
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <div class="scroll">
        <table class="dt">
          <colgroup>
            <col style="width: 56px" />     <!-- ID -->
            <col style="width: 200px" />    <!-- Site -->
            <col style="width: 160px" />    <!-- Interface -->
            <col style="width: 260px" />    <!-- Utilisation -->
            <col style="width: 150px" />    <!-- Recorded by -->
            <col style="width: 140px" />    <!-- Measured at -->
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>Site</th>
              <th>Interface</th>
              <th>Utilisation</th>
              <th>Recorded by</th>
              <th>Measured at</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.capacityId) {
              <tr>
                <td class="num">{{ r.capacityId }}</td>
                <td>
                  @if (r.siteCode || r.siteName) {
                    <div class="site-name">{{ r.siteCode || '—' }}</div>
                    <div class="site-sub">{{ r.siteName }}</div>
                  } @else { <span class="faint">—</span> }
                </td>
                <td>
                  <div class="iface-name">{{ r.interfaceName || '—' }}</div>
                  @if (r.interfaceCapacityMbps) {
                    <div class="iface-cap">rated {{ r.interfaceCapacityMbps | number }} Mbps</div>
                  }
                </td>
                <td>
                  <div class="util-row">
                    <div class="util-bar">
                      <div class="util-fill"
                           [class.util-good]="utilPct(r) < 70"
                           [class.util-warn]="utilPct(r) >= 70 && utilPct(r) < 90"
                           [class.util-hot]="utilPct(r) >= 90"
                           [style.width.%]="Math.min(utilPct(r), 100)"></div>
                    </div>
                    <div class="util-meta">
                      <span class="util-val">{{ r.measuredCapacityMbps | number }}</span>
                      @if (r.interfaceCapacityMbps) {
                        <span class="util-pct">{{ utilPct(r).toFixed(0) }}%</span>
                      }
                    </div>
                  </div>
                </td>
                <td>{{ r.recordedByName || '—' }}</td>
                <td class="muted">{{ r.measuredAt | date:'short' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No capacity records yet.</td></tr>
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
    .faint { color: var(--text-faint); font-style: italic; }

    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .scroll { overflow-x: auto; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; table-layout: fixed; }
    .dt th, .dt td { padding: 10px 14px; text-align: left;
                     border-bottom: 1px solid var(--border-soft); vertical-align: middle; }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase;
             letter-spacing: 0.04em; color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }

    .site-name { font-weight: 600; font-size: 12.5px; line-height: 1.2; }
    .site-sub  { font-size: 10.5px; color: var(--text-muted); margin-top: 2px;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .iface-name { font-weight: 500; font-family: ui-monospace, "Cascadia Mono", "JetBrains Mono", monospace;
                  font-size: 12px; }
    .iface-cap  { font-size: 10.5px; color: var(--text-muted); margin-top: 2px; }

    .util-row { display: flex; flex-direction: column; gap: 4px; }
    .util-bar { width: 100%; height: 6px; background: #eef2f6; border-radius: 999px;
                overflow: hidden; }
    .util-fill { height: 100%; border-radius: 999px; transition: width .25s ease; }
    .util-good { background: #16a34a; }
    .util-warn { background: #d97706; }
    .util-hot  { background: #dc2626; }
    .util-meta { display: flex; justify-content: space-between; align-items: center;
                 font-size: 11px; color: var(--text-muted); }
    .util-val { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary); }
    .util-pct { font-variant-numeric: tabular-nums; font-weight: 700; }
  `,
})
export class CapacityRecordsListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private currentUser = inject(CurrentUserService);
  private snack = inject(MatSnackBar);

  // Exposed so the template can use Math.min(...) directly in property bindings.
  protected Math = Math;

  rows = signal<any[]>([]);
  loading = signal(true);

  /** Measured throughput as a percentage of the interface's rated capacity. */
  utilPct(r: any): number {
    if (!r?.interfaceCapacityMbps || r.interfaceCapacityMbps <= 0) return 0;
    return (r.measuredCapacityMbps / r.interfaceCapacityMbps) * 100;
  }

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.capacityRecords().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(CapacityRecordFormDialog, { width: '420px' });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Measurement recorded', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

@Component({
  selector: 'app-capacity-record-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Record capacity measurement</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
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

        <mat-form-field appearance="outline">
          <mat-label>Interface</mat-label>
          <mat-select name="interfaceId" [(ngModel)]="model.interfaceId"
                      [disabled]="!selectedNodeId || !interfaces().length" required>
            @for (i of interfaces(); track i.interfaceId) {
              <mat-option [value]="i.interfaceId">{{ i.name }} (cap {{ i.capacityMbps }} Mbps)</mat-option>
            }
          </mat-select>
          @if (selectedNodeId && !interfaces().length) { <mat-hint>No interfaces on this node</mat-hint> }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Measured throughput (Mbps)</mat-label>
          <input matInput type="number" step="0.01" name="measuredCapacityMbps"
                 [(ngModel)]="model.measuredCapacityMbps" required min="0"
                 placeholder="e.g. 8420.5">
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">Record</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `.col { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }`,
})
export class CapacityRecordFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<CapacityRecordFormDialog>);
  private currentUser = inject(CurrentUserService);

  model: any = { siteId: null, interfaceId: null, measuredCapacityMbps: null };
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
    this.selectedNodeId = null; this.model.interfaceId = null;
    this.nodes.set([]); this.interfaces.set([]);
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
    const id = this.currentUser.userId();
    if (!id) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.api.createCapacityRecord({ ...this.model, recordedBy: id }).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Creation failed', 'OK', { duration: 4000 }),
    });
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export type CellKind = 'text' | 'date' | 'status' | 'priority' | 'number' | 'bool';

export interface ColumnDef {
  key: string;
  label: string;
  kind?: CellKind;
  width?: string;
}

/**
 * A reusable, dense list table.
 * Use it inside a feature component:
 *
 *   <app-data-table [columns]="cols" [rows]="rows()" [loading]="loading()" />
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatIconModule, MatProgressBarModule],
  template: `
    <div class="dt-card">
      <div class="dt-head">
        <div class="dt-title">
          <h2>{{ title }}</h2>
          @if (subtitle) { <span class="dt-sub">{{ subtitle }}</span> }
        </div>
        @if (rows.length) {
          <span class="dt-count">{{ rows.length }} {{ rows.length === 1 ? 'item' : 'items' }}</span>
        }
        <ng-content select="[actions]"></ng-content>
      </div>
      @if (loading) { <mat-progress-bar mode="indeterminate" class="dt-progress" /> }
      <div class="dt-wrap">
        <table class="dt">
          <thead>
            <tr>
              @for (c of columns; track c.key) {
                <th [style.width]="c.width || null">{{ c.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (rows.length) {
              @for (row of rows; track $index) {
                <tr>
                  @for (c of columns; track c.key) {
                    <td>
                      @switch (c.kind) {
                        @case ('date')     { <span class="muted">{{ row[c.key] | date:'short' }}</span> }
                        @case ('status')   { <span class="pill" [class]="'pill-' + (row[c.key] | lowercase)">{{ row[c.key] }}</span> }
                        @case ('priority') { <span class="pri" [class]="'pri-' + (row[c.key] | lowercase)">{{ row[c.key] }}</span> }
                        @case ('number')   { <span class="num">{{ row[c.key] }}</span> }
                        @case ('bool')     { @if (row[c.key]) { <mat-icon class="bool-y">check_circle</mat-icon> } @else { <mat-icon class="bool-n">remove_circle_outline</mat-icon> } }
                        @default           { <span>{{ row[c.key] ?? '—' }}</span> }
                      }
                    </td>
                  }
                </tr>
              }
            } @else if (!loading) {
              <tr>
                <td [attr.colspan]="columns.length" class="dt-empty">
                  <mat-icon>inbox</mat-icon>
                  <div>No {{ entityName || 'items' }} yet.</div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .dt-card { background: #fff; border: 1px solid var(--border-soft);
               border-radius: 8px; overflow: hidden; }
    .dt-head { display: flex; align-items: center; gap: 12px;
               padding: 12px 16px; border-bottom: 1px solid var(--border-soft); }
    .dt-title { flex: 1 1 auto; }
    .dt-title h2 { font-size: 14px; font-weight: 600; }
    .dt-sub { font-size: 11px; color: var(--text-muted); margin-left: 8px; }
    .dt-count { font-size: 11px; color: var(--text-muted); font-weight: 500; }
    .dt-progress { position: absolute !important; }

    .dt-wrap { overflow-x: auto; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left;
                     border-bottom: 1px solid var(--border-soft);
                     white-space: nowrap; }
    .dt th { font-size: 10.5px; font-weight: 600;
             text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .dt tbody tr:last-child td { border-bottom: none; }

    .muted { color: var(--text-muted); }
    .num   { font-variant-numeric: tabular-nums; font-weight: 500; }

    /* Status pills (generic) */
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px;
            border-radius: 4px; letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-active, .pill-online, .pill-resolved, .pill-up, .pill-pass, .pill-approved, .pill-completed, .pill-done, .pill-read
      { background: var(--success-bg); color: var(--success-fg); }
    .pill-maintenance, .pill-degraded, .pill-pending, .pill-in_progress, .pill-draft, .pill-testing, .pill-unread
      { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-inactive, .pill-offline, .pill-rejected, .pill-down, .pill-fail, .pill-suspended, .pill-cancelled, .pill-expired, .pill-closed
      { background: var(--danger-bg); color: var(--danger-fg); }
    .pill-open
      { background: var(--info-bg); color: var(--info-fg); }

    /* Priority badges */
    .pri { font-size: 10px; font-weight: 700; padding: 2px 7px;
           border-radius: 4px; letter-spacing: 0.05em; }
    .pri-p1, .pri-critical { background: #fee2e2; color: #991b1b; }
    .pri-p2, .pri-high     { background: #fed7aa; color: #9a3412; }
    .pri-p3, .pri-medium   { background: #fef3c7; color: #92400e; }
    .pri-p4, .pri-low      { background: #d1fae5; color: #065f46; }

    .bool-y { color: var(--success-fg) !important; }
    .bool-n { color: var(--text-faint) !important; }

    .dt-empty { padding: 32px !important; text-align: center !important;
                color: var(--text-faint); }
    .dt-empty mat-icon { font-size: 28px !important; height: 28px !important; width: 28px !important; }
    .dt-empty div { margin-top: 6px; font-size: 12px; }
  `,
})
export class DataTableComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() columns: ColumnDef[] = [];
  @Input() rows: any[] = [];
  @Input() loading = false;
  @Input() entityName?: string;
}

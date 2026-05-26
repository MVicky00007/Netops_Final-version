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
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() columns: ColumnDef[] = [];
  @Input() rows: any[] = [];
  @Input() loading = false;
  @Input() entityName?: string;
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Audit log" subtitle="Tamper-evident record of every audited action" entityName="audit entries"
        [columns]="cols" [rows]="rows()" [loading]="loading()" />
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'auditId',      label: 'ID', kind: 'number', width: '60px' },
    { key: 'userName',     label: 'User' },
    { key: 'action',       label: 'Action' },
    { key: 'resourceType', label: 'Resource' },
    { key: 'resourceId',   label: 'Resource ID' },
    { key: 'details',      label: 'Details' },
    { key: 'timestamp',    label: 'When', kind: 'date' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.auditLogs().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

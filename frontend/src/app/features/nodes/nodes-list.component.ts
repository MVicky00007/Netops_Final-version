import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-nodes-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Edge nodes"
        subtitle="Routers and switches across all sites"
        entityName="nodes"
        [columns]="cols" [rows]="rows()" [loading]="loading()" />
    </div>
  `,
})
export class NodesListComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'hostname',     label: 'Hostname' },
    { key: 'siteName',     label: 'Site' },
    { key: 'model',        label: 'Model' },
    { key: 'serialNumber', label: 'Serial' },
    { key: 'status',       label: 'Status', kind: 'status' },
    { key: 'installedAt',  label: 'Installed', kind: 'date' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.nodes().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

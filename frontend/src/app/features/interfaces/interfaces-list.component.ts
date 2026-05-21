import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-interfaces-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Interfaces"
        subtitle="All network interfaces across every edge node"
        entityName="interfaces"
        [columns]="cols"
        [rows]="rows()"
        [loading]="loading()" />
    </div>
  `,
})
export class InterfacesListComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'interfaceId',  label: 'ID',           kind: 'number', width: '60px' },
    { key: 'name',         label: 'Interface' },
    { key: 'nodeHostname', label: 'Node' },
    { key: 'siteName',     label: 'Site' },
    { key: 'type',         label: 'Type' },
    { key: 'capacityMbps', label: 'Capacity (Mbps)', kind: 'number' },
    { key: 'adminStatus',  label: 'Admin',        kind: 'status' },
    { key: 'operStatus',   label: 'Oper',         kind: 'status' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.interfaces().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

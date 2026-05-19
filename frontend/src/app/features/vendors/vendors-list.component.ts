import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-vendors-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Vendors" subtitle="Hardware and service partners" entityName="vendors"
        [columns]="cols" [rows]="rows()" [loading]="loading()" />
    </div>
  `,
})
export class VendorsListComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'vendorId',    label: 'ID', kind: 'number', width: '60px' },
    { key: 'name',        label: 'Vendor' },
    { key: 'contactInfo', label: 'Contact' },
    { key: 'contractRef', label: 'Contract' },
    { key: 'status',      label: 'Status', kind: 'status' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.vendors().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

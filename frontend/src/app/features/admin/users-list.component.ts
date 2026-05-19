import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="All users" subtitle="Everyone with an account on NetOpsOne" entityName="users"
        [columns]="cols" [rows]="rows()" [loading]="loading()" />
    </div>
  `,
})
export class AdminUsersListComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'userId', label: 'ID',    kind: 'number', width: '60px' },
    { key: 'name',   label: 'Name' },
    { key: 'email',  label: 'Email' },
    { key: 'phone',  label: 'Phone' },
    { key: 'role',   label: 'Role' },
    { key: 'status', label: 'Status', kind: 'status' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.users().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

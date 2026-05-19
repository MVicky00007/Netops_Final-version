import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-health-checks-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Health checks" subtitle="Automated probes monitoring the network" entityName="health checks"
        [columns]="cols" [rows]="rows()" [loading]="loading()" />
    </div>
  `,
})
export class HealthChecksListComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'checkId',         label: 'ID', kind: 'number', width: '60px' },
    { key: 'name',            label: 'Name' },
    { key: 'targetType',      label: 'Target' },
    { key: 'conditionText',   label: 'Condition' },
    { key: 'createdByName',   label: 'Created by' },
    { key: 'active',          label: 'Active', kind: 'bool' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.healthChecks().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

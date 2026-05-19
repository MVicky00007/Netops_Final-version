import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableComponent, ColumnDef } from '../../shared/data-table.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Notifications" subtitle="Alerts and updates for you" entityName="notifications"
        [columns]="cols" [rows]="rows()" [loading]="loading()" />
    </div>
  `,
})
export class NotificationsListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  cols: ColumnDef[] = [
    { key: 'notificationId', label: 'ID', kind: 'number', width: '60px' },
    { key: 'category',       label: 'Category' },
    { key: 'message',        label: 'Message' },
    { key: 'status',         label: 'Status', kind: 'status' },
    { key: 'createdAt',      label: 'Received', kind: 'date' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.users().subscribe({
      next: (users) => {
        const me = users.find((u) => u.email === this.auth.email());
        this.load(me?.userId ?? 1);
      },
      error: () => this.load(1),
    });
  }

  private load(userId: number) {
    this.api.notifications(userId).subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

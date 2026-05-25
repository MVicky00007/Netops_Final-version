import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatButtonToggleModule, MatProgressBarModule,
  ],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>Notifications</h1>
          <p class="muted">Alerts and updates for you</p>
        </div>
        <mat-button-toggle-group [(ngModel)]="filter" (change)="load()">
          <mat-button-toggle value="all">All</mat-button-toggle>
          <mat-button-toggle value="unread">Unread only</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr><th>ID</th><th>Category</th><th>Message</th><th>Status</th><th>Received</th><th></th></tr>
          </thead>
          <tbody>
            @for (n of rows(); track n.notificationId) {
              <tr [class.unread]="(n.status || '').toUpperCase() === 'UNREAD'">
                <td class="num">{{ n.notificationId }}</td>
                <td>{{ n.category }}</td>
                <td>{{ n.message }}</td>
                <td><span class="pill" [class]="'pill-' + (n.status || '').toLowerCase()">{{ n.status }}</span></td>
                <td class="muted">{{ n.createdAt | date:'short' }}</td>
                <td>
                  @if ((n.status || '').toUpperCase() === 'UNREAD') {
                    <button mat-icon-button (click)="markRead(n.notificationId)" matTooltip="Mark read">
                      <mat-icon>mark_email_read</mat-icon>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No {{ filter === 'unread' ? 'unread ' : '' }}notifications.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0; }
    .hdr p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
    .muted { color: var(--text-muted); }
    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .dt tbody tr.unread { background: rgba(59,130,246,.04); font-weight: 500; }
    .num { font-variant-numeric: tabular-nums; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-read { background: var(--success-bg); color: var(--success-fg); }
    .pill-unread { background: var(--warn-bg); color: var(--warn-fg); }
  `,
})
export class NotificationsListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);
  filter: 'all' | 'unread' = 'all';
  private userId = 1;

  ngOnInit() {
    this.api.users().subscribe({
      next: (users) => {
        const me = users.find((u) => u.email === this.auth.email());
        this.userId = me?.userId ?? 1;
        this.load();
      },
      error: () => this.load(),
    });
  }

  load() {
    this.loading.set(true);
    const obs = this.filter === 'unread' ? this.api.unreadNotifications(this.userId) : this.api.notifications(this.userId);
    obs.subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: number) {
    this.api.markNotificationRead(id).subscribe({
      next: () => { this.snack.open('Marked read', 'OK', { duration: 1800 }); this.load(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Failed', 'OK', { duration: 3000 }),
    });
  }
}

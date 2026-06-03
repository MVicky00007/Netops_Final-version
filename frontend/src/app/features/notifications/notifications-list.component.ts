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
  templateUrl: './notifications-list.component.html',
  styleUrl: './notifications-list.component.css',
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

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-pending-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './pending-users.component.html',
  styleUrl: './pending-users.component.css',
})
export class PendingUsersComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);
  busy = signal<number | null>(null);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.pendingUsers().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => { this.rows.set([]); this.loading.set(false); },
    });
  }

  initials(u: any): string {
    return (u.name || u.email || '?').split(' ')
      .map((p: string) => p[0]).join('').substring(0, 2).toUpperCase();
  }

  approve(userId: number) {
    this.busy.set(userId);
    this.http.put(`${environment.apiUrl}/approve-user?userId=${userId}`, {}, { responseType: 'text' })
      .subscribe({
        next: (msg) => {
          this.busy.set(null);
          this.snack.open(msg, 'OK', { duration: 2500 });
          this.refresh();
        },
        error: (err: any) => {
          this.busy.set(null);
          this.snack.open(err?.error?.message ?? 'Approve failed', 'OK', { duration: 3500 });
        },
      });
  }
}

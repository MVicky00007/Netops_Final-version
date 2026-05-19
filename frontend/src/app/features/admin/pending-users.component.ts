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
  template: `
    <div class="page">
      <div class="dt-card">
        <div class="dt-head">
          <div>
            <h2>Pending approvals</h2>
            <div class="dt-sub">New sign-ups awaiting an admin's review</div>
          </div>
          @if (rows().length) { <span class="dt-count">{{ rows().length }} waiting</span> }
        </div>
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

        @if (rows().length) {
          @for (u of rows(); track u.userId) {
            <div class="row">
              <div class="avatar">{{ initials(u) }}</div>
              <div class="body">
                <div class="title">{{ u.name }} <span class="muted">({{ u.role }})</span></div>
                <div class="meta">{{ u.email }} · {{ u.phone || 'no phone' }}</div>
              </div>
              <button mat-flat-button color="primary" (click)="approve(u.userId)" [disabled]="busy() === u.userId">
                <mat-icon>check</mat-icon> Approve
              </button>
            </div>
          }
        } @else if (!loading()) {
          <div class="empty">
            <mat-icon>check_circle</mat-icon>
            <div>No pending approvals.</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .dt-card { background:#fff; border:1px solid var(--border-soft);
               border-radius:8px; overflow:hidden; }
    .dt-head { display:flex; align-items:center; gap:12px;
               padding:12px 16px; border-bottom:1px solid var(--border-soft); }
    .dt-head h2 { font-size:14px; font-weight:600; }
    .dt-sub { font-size:11px; color:var(--text-muted); }
    .dt-count { font-size:11px; color:var(--text-muted); font-weight:500; margin-left:auto; }

    .row { display:flex; align-items:center; gap:12px;
           padding:12px 16px; border-bottom:1px solid var(--border-soft); }
    .row:last-child { border-bottom:none; }
    .avatar { width:32px; height:32px; border-radius:50%;
              background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);
              color:#fff; font-size:12px; font-weight:600;
              display:grid; place-items:center; }
    .body { flex:1 1 auto; min-width:0; }
    .title { font-size:13px; font-weight:600; }
    .meta { font-size:11px; color:var(--text-muted); margin-top:1px; }
    .muted { color:var(--text-muted); }

    .empty { padding:32px; text-align:center; color:var(--text-faint); }
    .empty mat-icon { font-size:32px; height:32px; width:32px; color:var(--success-fg) !important; }
    .empty div { margin-top:8px; font-size:13px; }
  `,
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

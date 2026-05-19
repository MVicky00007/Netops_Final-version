import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>My tasks</h1>
          <p class="muted">Tasks assigned to you</p>
        </div>
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Description</th><th>Related</th>
              <th>Due</th><th>Status</th><th>Update</th>
            </tr>
          </thead>
          <tbody>
            @for (t of rows(); track t.taskId) {
              <tr>
                <td>{{ t.taskId }}</td>
                <td>{{ t.description }}</td>
                <td>{{ t.relatedEntityId || '—' }}</td>
                <td class="muted">{{ t.dueDate | date:'mediumDate' }}</td>
                <td><span class="pill" [class]="'pill-' + (t.status || '').toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <button mat-icon-button [matMenuTriggerFor]="m">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #m="matMenu">
                    <button mat-menu-item (click)="updateStatus(t.taskId, 'IN_PROGRESS')"><mat-icon>play_arrow</mat-icon>Start (in progress)</button>
                    <button mat-menu-item (click)="updateStatus(t.taskId, 'COMPLETED')"><mat-icon>check_circle</mat-icon>Mark completed</button>
                    <button mat-menu-item (click)="updateStatus(t.taskId, 'CANCELLED')"><mat-icon>cancel</mat-icon>Cancel</button>
                    <button mat-menu-item (click)="updateStatus(t.taskId, 'PENDING')"><mat-icon>hourglass_top</mat-icon>Reset to pending</button>
                  </mat-menu>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No tasks assigned to you.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0; }
    .hdr p { font-size: 12px; color: var(--text-muted); margin: 2px 0 16px; }
    .muted { color: var(--text-muted); }
    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }
    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-pending     { background: var(--warn-bg); color: var(--warn-fg); }
    .pill-in_progress { background: var(--info-bg); color: var(--info-fg); }
    .pill-completed, .pill-done { background: var(--success-bg); color: var(--success-fg); }
    .pill-cancelled   { background: var(--danger-bg); color: var(--danger-fg); }
  `,
})
export class TasksListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private currentUser = inject(CurrentUserService);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.currentUser.resolveId().subscribe((id) => this.load(id ?? 1));
  }

  load(userId: number) {
    this.loading.set(true);
    this.api.tasks(userId).subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(taskId: number, status: string) {
    this.api.updateTaskStatus(taskId, status).subscribe({
      next: () => {
        this.snack.open(`Task marked ${status}`, 'OK', { duration: 2500 });
        this.load(this.currentUser.userId() ?? 1);
      },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Update failed', 'OK', { duration: 4000 }),
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule,
    MatButtonToggleModule, MatDialogModule,
  ],
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>My tasks</h1>
          <p class="muted">Tasks assigned to you</p>
        </div>
        <div class="hdr-actions">
          <mat-button-toggle-group [(ngModel)]="filter" (change)="onFilterChange()">
            <mat-button-toggle value="all">All</mat-button-toggle>
            <mat-button-toggle value="pending">Pending only</mat-button-toggle>
          </mat-button-toggle-group>
          @if (auth.hasRole('ADMIN','MANAGER')) {
            <button mat-flat-button color="primary" (click)="openCreate()">
              <mat-icon>add</mat-icon> Assign task
            </button>
          }
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
              <tr><td colspan="6" class="empty">No tasks {{ filter === 'pending' ? 'pending' : 'assigned' }}.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .hdr-actions { display: flex; gap: 12px; align-items: center; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0; }
    .hdr p { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
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
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);
  filter: 'all' | 'pending' = 'all';

  ngOnInit() {
    this.currentUser.resolveId().subscribe((id) => this.load(id ?? 1));
  }

  load(userId: number) {
    this.loading.set(true);
    const obs = this.filter === 'pending' ? this.api.pendingTasks(userId) : this.api.tasks(userId);
    obs.subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange() {
    this.load(this.currentUser.userId() ?? 1);
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

  openCreate() {
    const ref = this.dialog.open(TaskFormDialog, { width: '480px' });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Task assigned', 'OK', { duration: 2500 }); this.load(this.currentUser.userId() ?? 1); }
    });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Assign-task dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Assign task</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="col">
        <mat-form-field appearance="outline">
          <mat-label>Assigned user</mat-label>
          <mat-select name="assignedTo" [(ngModel)]="model.assignedTo" required>
            @for (u of users(); track u.userId) {
              <mat-option [value]="u.userId">{{ u.username }} — {{ u.role }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" name="description" [(ngModel)]="model.description" required></textarea>
        </mat-form-field>

        <div class="row2">
          <mat-form-field appearance="outline">
            <mat-label>Related entity type</mat-label>
            <mat-select name="relatedEntityType" [(ngModel)]="model.relatedEntityType">
              <mat-option value="TICKET">TICKET</mat-option>
              <mat-option value="FAULT">FAULT</mat-option>
              <mat-option value="PLAN">PLAN</mat-option>
              <mat-option value="NODE">NODE</mat-option>
              <mat-option value="OTHER">OTHER</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Related entity ID</mat-label>
            <input matInput type="number" name="relatedEntityId" [(ngModel)]="model.relatedEntityId">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Due date</mat-label>
          <input matInput type="date" name="dueDate" [(ngModel)]="model.dueDate">
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close type="button">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!f.form.valid">Assign</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .col { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  `,
})
export class TaskFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<TaskFormDialog>);

  users = signal<any[]>([]);
  model: any = {
    assignedTo: null, description: '', relatedEntityType: 'OTHER',
    relatedEntityId: null, dueDate: '', status: 'PENDING',
  };

  ngOnInit() {
    this.api.users().subscribe((u) => this.users.set(u));
  }

  submit() {
    this.api.createTask(this.model).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Assignment failed', 'OK', { duration: 4000 }),
    });
  }
}

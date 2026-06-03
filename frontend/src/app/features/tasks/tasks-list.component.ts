import { TaskFormDialog } from './task-form-dialog.component';
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
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.css',
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

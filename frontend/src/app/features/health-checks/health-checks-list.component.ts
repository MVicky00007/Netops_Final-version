import { HealthCheckFormDialog } from './health-check-form-dialog.component';
import { HealthCheckRunsDialog } from './health-check-runs-dialog.component';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-health-checks-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule,
    MatTooltipModule, MatButtonToggleModule, MatDialogModule,
  ],
  templateUrl: './health-checks-list.component.html',
  styleUrl: './health-checks-list.component.css',
})
export class HealthChecksListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  rows = signal<any[]>([]);
  loading = signal(true);
  filter: 'all' | 'active' = 'all';

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.load();
  }

  load() {
    this.loading.set(true);
    const obs = this.filter === 'active' ? this.api.activeHealthChecks() : this.api.healthChecks();
    obs.subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(check?: any) {
    const ref = this.dialog.open(HealthCheckFormDialog, { width: '480px', data: { check: check ?? null } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open(check ? 'Updated' : 'Created', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  run(check: any) {
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.api.runHealthCheck({ checkId: check.checkId, executedBy: userId }).subscribe({
      next: (r: any) => this.snack.open(`Run completed: ${r?.result ?? 'OK'}`, 'OK', { duration: 3000 }),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Run failed', 'OK', { duration: 4000 }),
    });
  }

  viewRuns(check: any) {
    this.dialog.open(HealthCheckRunsDialog, { width: '720px', data: { check } });
  }
}

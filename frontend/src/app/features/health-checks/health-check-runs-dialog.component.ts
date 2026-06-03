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
  selector: 'app-health-check-runs-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './health-check-runs-dialog.component.html',
  styleUrl: './health-check-runs-dialog.component.css',
})
export class HealthCheckRunsDialog implements OnInit {
  private api = inject(ApiService);
  runs = signal<any[]>([]);
  loading = signal(true);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { check: any }) {}

  ngOnInit() {
    this.api.healthCheckRuns(this.data.check.checkId).subscribe({
      next: (r) => { this.runs.set(r); this.loading.set(false); },
      error: () => { this.runs.set([]); this.loading.set(false); },
    });
  }
}

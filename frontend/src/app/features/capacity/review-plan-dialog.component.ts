import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-review-plan-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './review-plan-dialog.component.html',
  styleUrl: './review-plan-dialog.component.css',
})
export class ReviewPlanDialog {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<ReviewPlanDialog>);

  comments = '';
  submitting = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    plan: any;
    decision: 'APPROVED' | 'REJECTED';
    approverId: number;
  }) {}

  submit() {
    this.submitting.set(true);
    this.api.approveCapacityPlan(this.data.plan.planId, {
      approvedBy: this.data.approverId,
      status:     this.data.decision,
      comments:   this.comments.trim() ||
                  (this.data.decision === 'APPROVED' ? 'Approved.' : 'Rejected.'),
    }).subscribe({
      next: () => { this.submitting.set(false); this.ref.close(true); },
      error: (err: any) => {
        this.submitting.set(false);
        this.snack.open(err?.error?.message ?? 'Decision failed', 'OK', { duration: 4000 });
      },
    });
  }
}

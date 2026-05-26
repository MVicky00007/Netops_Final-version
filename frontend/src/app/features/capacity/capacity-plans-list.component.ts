import { ReviewPlanDialog } from './review-plan-dialog.component';
import { CapacityPlanFormDialog } from './capacity-plan-form-dialog.component';
import { PlanEvidenceDialog } from './plan-evidence-dialog.component';
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
  selector: 'app-capacity-plans-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatMenuModule, MatProgressBarModule, MatTooltipModule,
  ],
  templateUrl: './capacity-plans-list.component.html',
  styleUrl: './capacity-plans-list.component.css',
})
export class CapacityPlansListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private currentUser = inject(CurrentUserService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.capacityPlans().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(CapacityPlanFormDialog, {
      width: '480px',
      data: { userId: this.currentUser.userId() },
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.snack.open('Plan submitted', 'OK', { duration: 2500 });
        this.refresh();
      }
    });
  }

  openEvidence(plan: any) {
    this.dialog.open(PlanEvidenceDialog, { width: '640px', data: { plan } });
  }

  /**
   * Open the review dialog for the given plan. The dialog asks the manager
   * for comments (mandatory on REJECT, optional on APPROVE) and then submits
   * to POST /capacity-plans/{id}/approve with the chosen status.
   */
  openDecision(plan: any, decision: 'APPROVED' | 'REJECTED') {
    const approverId = this.currentUser.userId();
    if (!approverId) {
      this.snack.open('Could not resolve your user id', 'OK', { duration: 3000 });
      return;
    }
    const ref = this.dialog.open(ReviewPlanDialog, {
      width: '500px',
      data: { plan, decision, approverId },
    });
    ref.afterClosed().subscribe((done) => {
      if (done) {
        this.snack.open(
          `Plan #${plan.planId} ${decision === 'APPROVED' ? 'approved' : 'rejected'}`,
          'OK', { duration: 2500 });
        this.refresh();
      }
    });
  }
}

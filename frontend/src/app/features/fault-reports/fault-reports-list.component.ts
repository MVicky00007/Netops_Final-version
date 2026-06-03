import { FaultReportFormDialog } from './fault-report-form-dialog.component';
import { EscalateToTicketDialog } from './escalate-to-ticket-dialog.component';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-fault-reports-list',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressBarModule, MatMenuModule,
  ],
  templateUrl: './fault-reports-list.component.html',
  styleUrl: './fault-reports-list.component.css',
})
export class FaultReportsListComponent implements OnInit {
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
    this.api.faultReports().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(FaultReportFormDialog, { width: '480px' });
    ref.afterClosed().subscribe((created) => {
      if (created) { this.snack.open('Fault reported', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  escalate(fault: any) {
    const ref = this.dialog.open(EscalateToTicketDialog, { width: '460px', data: { fault } });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.snack.open(`Ticket #${created.ticketId} opened for fault #${fault.faultId}`, 'OK', { duration: 3500 });
        this.refresh();
      }
    });
  }

  updateStatus(faultId: number, status: string) {
    this.api.updateFaultStatus(faultId, status).subscribe({
      next: () => { this.snack.open(`Fault marked ${status}`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Update failed', 'OK', { duration: 4000 }),
    });
  }
}

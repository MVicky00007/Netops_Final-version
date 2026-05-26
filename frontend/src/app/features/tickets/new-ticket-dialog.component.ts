import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-new-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
  ],
  templateUrl: './new-ticket-dialog.component.html',
  styleUrl: './new-ticket-dialog.component.css',
})
export class NewTicketDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<NewTicketDialogComponent>);
  private currentUser = inject(CurrentUserService);

  faults = signal<any[]>([]);
  assignees = signal<any[]>([]);
  loadingFaults = signal(true);
  model: any = { faultId: null, priority: 'P3', assignedToId: null };

  ngOnInit() {
    this.api.faultReports().subscribe({
      next: (f) => {
        // Only OPEN / IN_PROGRESS faults are eligible for a NEW ticket.
        // (CLOSED/RESOLVED faults won't need new work; faults that already
        // have an active ticket would be rejected by the backend, but the
        // UI doesn't pre-filter those — the error is clear if it happens.)
        this.faults.set(f.filter((x) => {
          const s = (x.status || '').toUpperCase();
          return s !== 'CLOSED' && s !== 'RESOLVED';
        }));
        this.loadingFaults.set(false);
      },
      error: () => this.loadingFaults.set(false),
    });
    // Tickets are field work -> only field engineers can be assignees.
    this.api.users().subscribe({
      next: (u) => this.assignees.set(
        u.filter((x) => x.role === 'FIELD_ENGINEER' && (x.status || '').toUpperCase() === 'ACTIVE')
      ),
    });
  }

  submit() {
    const me = this.currentUser.userId();
    if (!me) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    const body: any = { faultId: this.model.faultId, createdById: me, priority: this.model.priority };
    if (this.model.assignedToId) body.assignedToId = this.model.assignedToId;
    this.api.createTicket(body).subscribe({
      next: (created) => this.ref.close(created),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Could not open ticket', 'OK', { duration: 4000 }),
    });
  }
}

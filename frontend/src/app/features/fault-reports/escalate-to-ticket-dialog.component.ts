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
  selector: 'app-escalate-to-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './escalate-to-ticket-dialog.component.html',
  styleUrl: './escalate-to-ticket-dialog.component.css',
})
export class EscalateToTicketDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<EscalateToTicketDialog>);
  private currentUser = inject(CurrentUserService);

  assignees = signal<any[]>([]);
  model: any = { priority: 'P3', assignedToId: null };

  constructor(@Inject(MAT_DIALOG_DATA) public data: { fault: any }) {
    // Default priority is derived from fault severity.
    const sev = (data.fault.severity || '').toUpperCase();
    this.model.priority =
      sev === 'CRITICAL' ? 'P1' :
      sev === 'HIGH'     ? 'P2' :
      sev === 'MEDIUM'   ? 'P3' : 'P4';
  }

  ngOnInit() {
    // Tickets are field work — only ACTIVE field engineers can be assignees.
    this.api.users().subscribe({
      next: (u) => this.assignees.set(
        u.filter((x) => x.role === 'FIELD_ENGINEER' && (x.status || '').toUpperCase() === 'ACTIVE')
      ),
    });
  }

  submit() {
    const me = this.currentUser.userId();
    if (!me) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    const body: any = {
      faultId: this.data.fault.faultId,
      createdById: me,
      priority: this.model.priority,
    };
    if (this.model.assignedToId) body.assignedToId = this.model.assignedToId;

    this.api.createTicket(body).subscribe({
      next: (created) => this.ref.close(created),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Could not open ticket', 'OK', { duration: 4000 }),
    });
  }
}

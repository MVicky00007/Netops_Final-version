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
  selector: 'app-assign-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './assign-ticket-dialog.component.html',
  styleUrl: './assign-ticket-dialog.component.css',
})
export class AssignTicketDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<AssignTicketDialogComponent>);

  assignees = signal<any[]>([]);
  assignedToId: number | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticket: any }) {}

  ngOnInit() {
    // Only ACTIVE field engineers can hold a ticket.
    this.api.users().subscribe({
      next: (u) => this.assignees.set(
        u.filter((x) => x.role === 'FIELD_ENGINEER' && (x.status || '').toUpperCase() === 'ACTIVE')
      ),
    });
  }

  submit() {
    if (!this.assignedToId) return;
    this.api.assignTicket(this.data.ticket.ticketId, this.assignedToId).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Assign failed', 'OK', { duration: 4000 }),
    });
  }
}

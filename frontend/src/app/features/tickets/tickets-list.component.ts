import { NewTicketDialogComponent } from './new-ticket-dialog.component';
import { AttachmentsDialogComponent } from './attachments-dialog.component';
import { AssignTicketDialogComponent } from './assign-ticket-dialog.component';
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
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatMenuModule,
            MatProgressBarModule, MatDialogModule, MatDividerModule],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.css',
})
export class TicketsListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.tickets().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(ticketId: number, status: string) {
    this.api.updateTicketStatus(ticketId, status).subscribe({
      next: () => { this.snack.open(`Ticket marked ${status}`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Update failed', 'OK', { duration: 4000 }),
    });
  }

  viewAttachments(ticketId: number) {
    this.dialog.open(AttachmentsDialogComponent, { width: '560px', data: { ticketId } });
  }

  openAssign(ticket: any) {
    const ref = this.dialog.open(AssignTicketDialogComponent, { width: '420px', data: { ticket } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Ticket reassigned', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  openCreate() {
    const ref = this.dialog.open(NewTicketDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.snack.open(`Ticket #${created.ticketId} opened`, 'OK', { duration: 3000 });
        this.refresh();
      }
    });
  }
}

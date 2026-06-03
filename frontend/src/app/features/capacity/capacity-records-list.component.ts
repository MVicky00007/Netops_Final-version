import { CapacityRecordFormDialog } from './capacity-record-form-dialog.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-capacity-records-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule,
            MatButtonModule, MatIconModule, MatDialogModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './capacity-records-list.component.html',
  styleUrl: './capacity-records-list.component.css',
})
export class CapacityRecordsListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private currentUser = inject(CurrentUserService);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.capacityRecords().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(CapacityRecordFormDialog, { width: '420px' });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Measurement recorded', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

import { RoleDialog } from './role-dialog.component';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.component';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

const ROLES = ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'] as const;

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule,
    MatTooltipModule, MatDividerModule, MatDialogModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
})
export class AdminUsersListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.users().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changeRole(u: any) {
    const ref = this.dialog.open(RoleDialog, { width: '360px', data: { user: u } });
    ref.afterClosed().subscribe((newRole) => {
      if (!newRole || newRole === u.role) return;
      this.api.updateRole(u.userId, newRole).subscribe({
        next: () => { this.snack.open(`Role updated to ${newRole}`, 'OK', { duration: 2500 }); this.refresh(); },
        error: (err: any) => this.snack.open(err?.error ?? 'Update failed', 'OK', { duration: 4000 }),
      });
    });
  }

  block(u: any) {
    this.api.blockUser(u.userId).subscribe({
      next: () => { this.snack.open(`${u.name || u.email} blocked`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error ?? 'Block failed', 'OK', { duration: 4000 }),
    });
  }

  unblock(u: any) {
    this.api.unblockUser(u.userId).subscribe({
      next: () => { this.snack.open(`${u.name || u.email} reactivated`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error ?? 'Unblock failed', 'OK', { duration: 4000 }),
    });
  }

  approve(u: any) {
    this.api.approveUser(u.userId).subscribe({
      next: () => { this.snack.open(`${u.name || u.email} approved`, 'OK', { duration: 2500 }); this.refresh(); },
      error: (err: any) => this.snack.open(err?.error ?? 'Approval failed', 'OK', { duration: 4000 }),
    });
  }

  confirmDelete(u: any) {
    const ref = this.dialog.open(ConfirmDeleteDialog, { width: '420px', data: { user: u } });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.deleteUser(u.userId).subscribe({
        next: () => { this.snack.open(`Deleted ${u.name || u.email}`, 'OK', { duration: 2500 }); this.refresh(); },
        error: (err: any) => this.snack.open(err?.error ?? 'Delete failed — user may be referenced elsewhere', 'OK', { duration: 4500 }),
      });
    });
  }
}

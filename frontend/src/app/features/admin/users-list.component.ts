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
  template: `
    <div class="page">
      <div class="hdr">
        <div>
          <h1>All users</h1>
          <p class="muted">Everyone with an account on NetOpsOne — admin can change role / block / unblock / delete</p>
        </div>
      </div>

      <div class="panel">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table class="dt">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
              <th>Role</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of rows(); track u.userId) {
              <tr [class.self]="u.email === auth.email()">
                <td class="num">{{ u.userId }}</td>
                <td><strong>{{ u.name || '—' }}</strong>
                  @if (u.email === auth.email()) { <span class="self-pill">you</span> }
                </td>
                <td>{{ u.email }}</td>
                <td class="muted">{{ u.phone || '—' }}</td>
                <td><span class="role-pill" [class]="'role-' + (u.role || '').toLowerCase()">{{ u.role }}</span></td>
                <td><span class="pill" [class]="'pill-' + (u.status || '').toLowerCase()">{{ u.status }}</span></td>
                <td>
                  <button mat-icon-button [matMenuTriggerFor]="m"
                          [disabled]="u.email === auth.email()"
                          [matTooltip]="u.email === auth.email() ? 'You cannot edit your own account here' : 'Actions'">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #m="matMenu">
                    <button mat-menu-item (click)="changeRole(u)">
                      <mat-icon>badge</mat-icon>Change role
                    </button>
                    @if (u.status === 'ACTIVE') {
                      <button mat-menu-item (click)="block(u)">
                        <mat-icon>block</mat-icon>Block (suspend)
                      </button>
                    } @else if (u.status === 'SUSPENDED') {
                      <button mat-menu-item (click)="unblock(u)">
                        <mat-icon>lock_open</mat-icon>Unblock (reactivate)
                      </button>
                    } @else if (u.status === 'INACTIVE') {
                      <button mat-menu-item (click)="approve(u)">
                        <mat-icon>check_circle</mat-icon>Approve account
                      </button>
                    }
                    <mat-divider />
                    <button mat-menu-item class="danger" (click)="confirmDelete(u)">
                      <mat-icon>delete</mat-icon>Delete user
                    </button>
                  </mat-menu>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">No users registered yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .page { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .hdr h1 { font-size: 20px; font-weight: 600; margin: 0 0 2px; }
    .hdr p  { font-size: 12px; color: var(--text-muted); margin: 0 0 16px; }
    .muted { color: var(--text-muted); }
    .panel { background: #fff; border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; }
    .dt { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dt th, .dt td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border-soft); }
    .dt th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
             color: var(--text-muted); background: #fafbfc; }
    .dt tbody tr:hover { background: rgba(15,23,42,.02); }
    .dt tbody tr.self  { background: rgba(59,130,246,.03); }
    .num { font-variant-numeric: tabular-nums; font-weight: 500; }
    .empty { text-align: center; padding: 32px; color: var(--text-faint); }

    .self-pill { font-size: 9.5px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
                 margin-left: 6px; background: var(--info-bg); color: var(--info-fg);
                 text-transform: uppercase; letter-spacing: 0.04em; }

    .pill { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
            letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-active   { background: var(--success-bg); color: var(--success-fg); }
    .pill-inactive { background: var(--warn-bg);    color: var(--warn-fg); }
    .pill-suspended{ background: var(--danger-bg); color: var(--danger-fg); }

    .role-pill { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
                 letter-spacing: 0.03em; text-transform: uppercase; }
    .role-admin            { background: rgba(30,58,138,.10); color: #1e3a8a; }
    .role-manager          { background: rgba(91,33,182,.10); color: #6d28d9; }
    .role-network_engineer { background: rgba(6,95,70,.10);  color: #065f46; }
    .role-field_engineer   { background: rgba(194,65,12,.10); color: #c2410c; }
    .role-auditor          { background: rgba(55,65,81,.10);  color: #374151; }

    ::ng-deep .mat-mdc-menu-item.danger { color: var(--danger-fg) !important; }
    ::ng-deep .mat-mdc-menu-item.danger mat-icon { color: var(--danger-fg) !important; }
  `,
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

// ────────────────────────────────────────────────────────────────────────
// Change-role dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Change role for {{ data.user.name || data.user.email }}</h2>
    <mat-dialog-content class="col">
      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select [(ngModel)]="role">
          @for (r of roles; track r) {
            <mat-option [value]="r">{{ r }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <p class="muted small">Note: changing the role will also set the account status to ACTIVE.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="role">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .col { display: flex; flex-direction: column; gap: 6px; padding-top: 12px !important; }
    .muted { color: var(--text-muted); }
    .small { font-size: 11.5px; margin: 0; }
  `,
})
export class RoleDialog {
  roles = ROLES;
  role: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: any }) {
    this.role = data.user.role;
  }
}

// ────────────────────────────────────────────────────────────────────────
// Confirm-delete dialog
// ────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title><mat-icon class="warn">warning</mat-icon> Delete this user?</h2>
    <mat-dialog-content>
      <p>You're about to permanently delete:</p>
      <ul>
        <li><strong>{{ data.user.name || data.user.email }}</strong></li>
        <li>{{ data.user.email }}</li>
        <li>Role: {{ data.user.role }}</li>
      </ul>
      <p class="warn-text">
        If this user has reported faults, opened tickets, approved plans, or has other
        records pointing to them, the delete will fail with a foreign-key error. Consider
        blocking them instead.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">
        <mat-icon>delete</mat-icon> Delete
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .warn { color: var(--danger-fg) !important; }
    ul { margin: 6px 0 12px 18px; padding: 0; font-size: 13px; }
    li { margin-bottom: 2px; }
    .warn-text { font-size: 12px; color: var(--danger-fg); }
  `,
})
export class ConfirmDeleteDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: any }) {}
}

import { InterfaceFormDialog } from './interface-form-dialog.component';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-interfaces-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, MatDialogModule],
  templateUrl: './interfaces-list.component.html',
  styleUrl: './interfaces-list.component.css',
})
export class InterfacesListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.interfaces().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(InterfaceFormDialog, { width: '480px', data: { iface: null } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Interface created', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  openEdit(iface: any) {
    const ref = this.dialog.open(InterfaceFormDialog, { width: '480px', data: { iface } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Interface updated', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

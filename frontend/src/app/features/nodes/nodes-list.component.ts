import { NodeFormDialog } from './node-form-dialog.component';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  selector: 'app-nodes-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, MatDialogModule],
  templateUrl: './nodes-list.component.html',
  styleUrl: './nodes-list.component.css',
})
export class NodesListComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.nodes().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    const ref = this.dialog.open(NodeFormDialog, { width: '480px', data: { node: null } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Node created', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }

  openEdit(node: any) {
    const ref = this.dialog.open(NodeFormDialog, { width: '480px', data: { node } });
    ref.afterClosed().subscribe((ok) => {
      if (ok) { this.snack.open('Node updated', 'OK', { duration: 2500 }); this.refresh(); }
    });
  }
}

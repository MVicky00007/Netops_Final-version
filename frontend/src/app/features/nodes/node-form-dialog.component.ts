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
  selector: 'app-node-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './node-form-dialog.component.html',
  styleUrl: './node-form-dialog.component.css',
})
export class NodeFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<NodeFormDialog>);

  sites = signal<any[]>([]);
  siteId: number | null = null;
  model: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { node: any | null }) {
    this.model = data.node
      ? { ...data.node, installedAt: data.node.installedAt?.substring(0, 10) }
      : { hostname: '', model: '', serialNumber: '', managementIp: '', status: 'ONLINE', installedAt: '' };
  }

  ngOnInit() {
    if (!this.data.node) {
      this.api.sites().subscribe((s) => this.sites.set(s));
    }
  }

  submit() {
    const op = this.data.node
      ? this.api.updateNode(this.data.node.nodeId, this.model)
      : this.api.createNode(this.siteId!, this.model);
    op.subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Save failed', 'OK', { duration: 4000 }),
    });
  }
}

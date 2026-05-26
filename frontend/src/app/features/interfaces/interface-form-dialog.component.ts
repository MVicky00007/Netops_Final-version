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
  selector: 'app-interface-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './interface-form-dialog.component.html',
  styleUrl: './interface-form-dialog.component.css',
})
export class InterfaceFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<InterfaceFormDialog>);

  sites = signal<any[]>([]);
  nodes = signal<any[]>([]);
  siteId: number | null = null;
  nodeId: number | null = null;
  model: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { iface: any | null }) {
    this.model = data.iface
      ? { ...data.iface }
      : { name: '', type: 'FIBER', capacityMbps: 1000, ipAddress: '', adminStatus: 'UP', operStatus: 'UP' };
  }

  ngOnInit() {
    if (!this.data.iface) this.api.sites().subscribe((s) => this.sites.set(s));
  }

  onSite(siteId: number) {
    this.nodeId = null;
    this.nodes.set([]);
    if (siteId) this.api.nodesBySite(siteId).subscribe((n) => this.nodes.set(n));
  }

  submit() {
    const op = this.data.iface
      ? this.api.updateInterface(this.data.iface.interfaceId, this.model)
      : this.api.createInterface(this.nodeId!, this.model);
    op.subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Save failed', 'OK', { duration: 4000 }),
    });
  }
}

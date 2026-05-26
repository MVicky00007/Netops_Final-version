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
  selector: 'app-capacity-record-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './capacity-record-form-dialog.component.html',
  styleUrl: './capacity-record-form-dialog.component.css',
})
export class CapacityRecordFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<CapacityRecordFormDialog>);
  private currentUser = inject(CurrentUserService);

  model: any = { siteId: null, interfaceId: null, measuredCapacityMbps: null };
  selectedNodeId: number | null = null;

  sites      = signal<any[]>([]);
  nodes      = signal<any[]>([]);
  interfaces = signal<any[]>([]);

  ngOnInit() {
    this.api.sites().subscribe({
      next: (s) => this.sites.set(s),
      error: () => this.snack.open('Could not load sites', 'OK', { duration: 3000 }),
    });
  }

  onSiteChange(siteId: number | null) {
    this.selectedNodeId = null; this.model.interfaceId = null;
    this.nodes.set([]); this.interfaces.set([]);
    if (!siteId) return;
    this.api.nodesBySite(siteId).subscribe({
      next: (n) => this.nodes.set(n),
      error: () => this.nodes.set([]),
    });
  }

  onNodeChange(nodeId: number | null) {
    this.model.interfaceId = null;
    this.interfaces.set([]);
    if (!nodeId) return;
    this.api.interfacesByNode(nodeId).subscribe({
      next: (i) => this.interfaces.set(i),
      error: () => this.interfaces.set([]),
    });
  }

  submit() {
    const id = this.currentUser.userId();
    if (!id) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.api.createCapacityRecord({ ...this.model, recordedBy: id }).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Creation failed', 'OK', { duration: 4000 }),
    });
  }
}

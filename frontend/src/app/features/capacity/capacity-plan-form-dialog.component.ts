import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-capacity-plan-form-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './capacity-plan-form-dialog.component.html',
  styleUrl: './capacity-plan-form-dialog.component.css',
})
export class CapacityPlanFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<CapacityPlanFormDialog>);
  private currentUser = inject(CurrentUserService);

  model = {
    siteId: null as number | null,
    interfaceId: null as number | null,
    currentCapacity: null as number | null,
    proposedCapacity: null as number | null,
    reason: '',
  };

  // Node is just a UI helper to filter the interface dropdown — not sent to backend.
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
    this.selectedNodeId = null;
    this.model.interfaceId = null;
    this.nodes.set([]);
    this.interfaces.set([]);
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
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved yet — try again', 'OK', { duration: 3000 }); return; }
    this.api.createCapacityPlan({ ...this.model, requestedBy: userId }).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Submission failed', 'OK', { duration: 4000 }),
    });
  }
}

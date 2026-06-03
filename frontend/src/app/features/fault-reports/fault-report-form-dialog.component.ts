import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-fault-report-form-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
  ],
  templateUrl: './fault-report-form-dialog.component.html',
  styleUrl: './fault-report-form-dialog.component.css',
})
export class FaultReportFormDialog implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<FaultReportFormDialog>);
  private currentUser = inject(CurrentUserService);

  severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  model = {
    siteId: null as number | null,
    nodeId: null as number | null,
    interfaceId: null as number | null,
    severity: 'MEDIUM',
    description: '',
  };

  sites      = signal<any[]>([]);
  nodes      = signal<any[]>([]);
  interfaces = signal<any[]>([]);
  loadingNodes  = signal(false);
  loadingIfaces = signal(false);

  ngOnInit() {
    this.api.sites().subscribe({
      next: (s) => this.sites.set(s),
      error: () => this.snack.open('Could not load sites', 'OK', { duration: 3000 }),
    });
  }

  onSiteChange(siteId: number | null) {
    this.model.nodeId = null;
    this.model.interfaceId = null;
    this.nodes.set([]);
    this.interfaces.set([]);
    if (!siteId) return;
    this.loadingNodes.set(true);
    this.api.nodesBySite(siteId).subscribe({
      next: (n) => { this.nodes.set(n); this.loadingNodes.set(false); },
      error: () => { this.nodes.set([]); this.loadingNodes.set(false); },
    });
  }

  onNodeChange(nodeId: number | null) {
    this.model.interfaceId = null;
    this.interfaces.set([]);
    if (!nodeId) return;
    this.loadingIfaces.set(true);
    this.api.interfacesByNode(nodeId).subscribe({
      next: (i) => { this.interfaces.set(i); this.loadingIfaces.set(false); },
      error: () => { this.interfaces.set([]); this.loadingIfaces.set(false); },
    });
  }

  submit() {
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    const body: any = { reportedById: userId, siteId: this.model.siteId,
                        severity: this.model.severity, description: this.model.description };
    if (this.model.nodeId)      body.nodeId      = this.model.nodeId;
    if (this.model.interfaceId) body.interfaceId = this.model.interfaceId;
    this.api.createFaultReport(body).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Submission failed', 'OK', { duration: 4000 }),
    });
  }
}

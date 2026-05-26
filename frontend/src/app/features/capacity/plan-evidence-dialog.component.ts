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
  selector: 'app-plan-evidence-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule,
  ],
  templateUrl: './plan-evidence-dialog.component.html',
  styleUrl: './plan-evidence-dialog.component.css',
})
export class PlanEvidenceDialog implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  items = signal<any[]>([]);
  loading = signal(true);
  uploading = signal(false);
  file: File | null = null;
  notes = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { plan: any }) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.planEvidence(this.data.plan.planId).subscribe({
      next: (r) => { this.items.set(r); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); },
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  upload() {
    if (!this.file) return;
    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.uploading.set(true);
    this.api.uploadPlanEvidence(this.data.plan.planId, this.file, userId, this.notes || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file = null; this.notes = '';
        this.snack.open('Evidence uploaded', 'OK', { duration: 2500 });
        this.refresh();
      },
      error: (err: any) => {
        this.uploading.set(false);
        this.snack.open(err?.error?.message ?? 'Upload failed', 'OK', { duration: 4000 });
      },
    });
  }

  download(e: any) {
    this.api.downloadPlanEvidence(this.data.plan.planId, e.evidenceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = e.fileName || `evidence-${e.evidenceId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Download failed', 'OK', { duration: 3000 }),
    });
  }
}

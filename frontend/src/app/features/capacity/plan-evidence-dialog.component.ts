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
  // ── Upload restrictions ──────────────────────────────────────────────
  /** MIME types that the browser file picker AND our client-side check accept. */
  readonly ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  /** Lowercase extensions that we additionally check (some browsers/OSes lie about MIME). */
  readonly ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  /** Max upload size in bytes. 5 MB is plenty for an evidence photo. */
  readonly MAX_SIZE = 5 * 1024 * 1024;
  /** Comma-joined string used by the <input accept="..."> attribute. */
  readonly ACCEPT = this.ALLOWED_MIME.join(',');

  protected auth = inject(AuthService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  items = signal<any[]>([]);
  loading = signal(true);
  uploading = signal(false);
  file: File | null = null;
  notes = '';
  /** Holds a human-readable reason when a chosen file is rejected. */
  fileError = signal<string | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { plan: any }) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.api.planEvidence(this.data.plan.planId).subscribe({
      next: (r) => { this.items.set(r); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); },
    });
  }

  /**
   * Called when the user picks a file. We validate BOTH MIME type and file
   * extension — never trust just one (the OS sometimes reports a bogus MIME).
   * Also enforces a size ceiling. On any failure the file is dropped and a
   * red error message is shown beneath the picker.
   */
  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0] ?? null;
    this.fileError.set(null);
    this.file = null;

    if (!picked) return;

    // 1. MIME check
    const mime = (picked.type || '').toLowerCase();
    const mimeOk = this.ALLOWED_MIME.includes(mime);

    // 2. Extension fallback
    const lastDot = picked.name.lastIndexOf('.');
    const ext = lastDot >= 0 ? picked.name.slice(lastDot + 1).toLowerCase() : '';
    const extOk = this.ALLOWED_EXT.includes(ext);

    if (!mimeOk && !extOk) {
      this.fileError.set(
        `Only image files are allowed (${this.ALLOWED_EXT.join(', ').toUpperCase()}). ` +
        `"${picked.name}" is not an image.`,
      );
      // Reset the input so the same bad file can be re-picked after a fix
      input.value = '';
      return;
    }

    // 3. Size check
    if (picked.size > this.MAX_SIZE) {
      const mb = (picked.size / (1024 * 1024)).toFixed(1);
      const maxMb = (this.MAX_SIZE / (1024 * 1024)).toFixed(0);
      this.fileError.set(`File is too large (${mb} MB). Maximum allowed: ${maxMb} MB.`);
      input.value = '';
      return;
    }

    // All good — accept it
    this.file = picked;
  }

  /** Pretty-print the chosen file's size for the UI. */
  fileSizeLabel(): string {
    if (!this.file) return '';
    const kb = this.file.size / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  }

  upload() {
    if (!this.file) return;

    // Defensive: re-validate just before uploading, in case something mutated the field.
    const mime = (this.file.type || '').toLowerCase();
    const ext = this.file.name.includes('.') ? this.file.name.split('.').pop()!.toLowerCase() : '';
    if (!this.ALLOWED_MIME.includes(mime) && !this.ALLOWED_EXT.includes(ext)) {
      this.fileError.set('Only image files (JPG, PNG, GIF, WEBP) are allowed.');
      return;
    }
    if (this.file.size > this.MAX_SIZE) {
      this.fileError.set('File exceeds the 5 MB limit.');
      return;
    }

    const userId = this.currentUser.userId();
    if (!userId) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }
    this.uploading.set(true);
    this.api.uploadPlanEvidence(this.data.plan.planId, this.file, userId, this.notes || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file = null; this.notes = ''; this.fileError.set(null);
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

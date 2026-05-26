import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-attachments-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatDialogModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './attachments-dialog.component.html',
  styleUrl: './attachments-dialog.component.css',
})
export class AttachmentsDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private currentUser = inject(CurrentUserService);

  loading = signal(true);
  uploading = signal(false);
  attachments = signal<any[]>([]);
  file: File | null = null;
  description = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticketId: number }) {}

  ngOnInit() {
    this.currentUser.resolveId().subscribe();
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.ticketAttachments(this.data.ticketId).subscribe({
      next: (a) => {
        const enriched = a.map((row) => ({ ...row }));
        // Pull image bytes so we can render an <img> thumbnail inline.
        enriched.forEach((row) => {
          if (this.isImage(row.fileUri)) {
            this.api.downloadTicketAttachment(this.data.ticketId, row.attachmentId).subscribe({
              next: (blob) => {
                row.previewUrl = window.URL.createObjectURL(blob);
                this.attachments.set([...enriched]);
              },
              error: () => { /* fall back to a download button */ },
            });
          }
        });
        this.attachments.set(enriched);
        this.loading.set(false);
      },
      error: () => { this.attachments.set([]); this.loading.set(false); },
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  upload() {
    if (!this.file) return;
    const me = this.currentUser.userId();
    if (!me) { this.snack.open('User id not resolved yet', 'OK', { duration: 3000 }); return; }
    this.uploading.set(true);
    this.api.uploadTicketAttachmentFile(this.data.ticketId, this.file, me, this.description || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file = null; this.description = '';
        this.snack.open('Attachment uploaded', 'OK', { duration: 2500 });
        this.refresh();
      },
      error: (err: any) => {
        this.uploading.set(false);
        this.snack.open(err?.error?.message ?? 'Upload failed', 'OK', { duration: 4000 });
      },
    });
  }

  download(a: any) {
    this.api.downloadTicketAttachment(this.data.ticketId, a.attachmentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.basename(a.fileUri);
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Download failed', 'OK', { duration: 3000 }),
    });
  }

  isImage(uri: string): boolean {
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(uri || '');
  }

  basename(uri: string): string {
    if (!uri) return '—';
    const parts = uri.split(/[\\/]/);
    return parts[parts.length - 1];
  }
}

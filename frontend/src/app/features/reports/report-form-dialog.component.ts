import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';

@Component({
  selector: 'app-report-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './report-form-dialog.component.html',
  styleUrl: './report-form-dialog.component.css',
})
export class ReportFormDialog {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<ReportFormDialog>);
  private currentUser = inject(CurrentUserService);

  model: any = {
    type: 'INCIDENT',
    window: '30d',
    severity: null,
    priority: null,
    title: '',
  };

  typeDescription(): string {
    switch (this.model.type) {
      case 'INCIDENT': return 'Open / resolved fault counts, MTTR, top sites by incidents';
      case 'CAPACITY': return 'Plans, approvals, measured throughput vs target';
      case 'SLA':      return 'Tickets that breached or met SLA windows';
      default:         return '';
    }
  }

  submit() {
    const id = this.currentUser.userId();
    if (!id) { this.snack.open('User id not resolved', 'OK', { duration: 3000 }); return; }

    const params: Record<string, string> = { window: this.model.window };
    if (this.model.severity) params['severity'] = this.model.severity;
    if (this.model.priority) params['priority'] = this.model.priority;
    if (this.model.title)    params['title']    = this.model.title;

    // We still record a logical reportUri for legacy compatibility, but the
    // download is generated client-side from the saved parametersJson.
    const safeTitle = (this.model.title || `${this.model.type.toLowerCase()}-${this.model.window}`)
                        .toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const reportUri = `csv://${safeTitle}-${Date.now()}`;

    this.api.generateReport({
      type: this.model.type,
      parametersJson: JSON.stringify(params),
      reportUri,
      generatedBy: id,
    }).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Generation failed', 'OK', { duration: 4000 }),
    });
  }
}

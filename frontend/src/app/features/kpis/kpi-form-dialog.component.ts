import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-kpi-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './kpi-form-dialog.component.html',
  styleUrl: './kpi-form-dialog.component.css',
})
export class KpiFormDialog {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<KpiFormDialog>);

  model: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { kpi: any | null }) {
    this.model = data.kpi
      ? { ...data.kpi }
      : { name: '', definition: '', targetValue: null, currentValue: null, reportingPeriod: 'MONTHLY' };
  }

  submit() {
    const op = this.data.kpi
      ? this.api.updateKpi(this.data.kpi.kpiId, this.model)
      : this.api.createKpi(this.model);
    op.subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Save failed', 'OK', { duration: 4000 }),
    });
  }
}

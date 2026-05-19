import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SiteService } from '../site.service';
import { SiteRequest, SiteStatus } from '../../../core/models/site.model';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
  ],
  template: `
    <div class="page">
      <a mat-button routerLink="/sites"><mat-icon>arrow_back</mat-icon> Back to sites</a>

      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ id ? 'Edit site' : 'New site' }}</mat-card-title>
        </mat-card-header>

        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

        <mat-card-content>
          <form (ngSubmit)="submit()" #f="ngForm" class="form">
            <mat-form-field appearance="outline">
              <mat-label>Site code</mat-label>
              <input matInput name="siteCode" [(ngModel)]="model.siteCode" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput name="name" [(ngModel)]="model.name" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Region</mat-label>
              <input matInput name="region" [(ngModel)]="model.region">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select name="status" [(ngModel)]="model.status" required>
                @for (s of statuses; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Address</mat-label>
              <input matInput name="address" [(ngModel)]="model.address">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Latitude</mat-label>
              <input matInput type="number" name="latitude" [(ngModel)]="model.latitude" step="0.0001">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Longitude</mat-label>
              <input matInput type="number" name="longitude" [(ngModel)]="model.longitude" step="0.0001">
            </mat-form-field>

            <div class="actions col-span-2">
              <a mat-button routerLink="/sites">Cancel</a>
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="!f.form.valid || saving()">
                {{ id ? 'Save changes' : 'Create site' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .page { padding: 24px; max-width: 900px; margin: 0 auto; }
    mat-card { margin-top: 16px; }
    .form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 16px; }
    .col-span-2 { grid-column: span 2; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
  `,
})
export class SiteFormComponent implements OnInit {
  @Input() id?: string;   // populated by withComponentInputBinding() from route params

  private siteService = inject(SiteService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  statuses: SiteStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
  model: SiteRequest = {
    siteCode: '', name: '', region: '', address: '',
    latitude: undefined, longitude: undefined, status: 'ACTIVE',
  };
  loading = signal(false);
  saving = signal(false);

  ngOnInit() {
    if (this.id) {
      this.loading.set(true);
      this.siteService.get(+this.id).subscribe({
        next: (s) => {
          this.model = {
            siteCode: s.siteCode, name: s.name, region: s.region ?? '',
            address: s.address ?? '', latitude: s.latitude, longitude: s.longitude,
            status: s.status,
          };
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snack.open('Could not load site: ' + (err.message || 'unknown'), 'OK', { duration: 4000 });
        },
      });
    }
  }

  submit() {
    this.saving.set(true);
    const obs = this.id
      ? this.siteService.update(+this.id, this.model)
      : this.siteService.create(this.model);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(this.id ? 'Site updated' : 'Site created', 'OK', { duration: 2500 });
        this.router.navigate(['/sites']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? err?.error ?? 'Save failed.';
        this.snack.open(msg, 'OK', { duration: 4000 });
      },
    });
  }
}

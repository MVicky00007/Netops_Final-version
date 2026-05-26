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
  templateUrl: './site-form.component.html',
  styleUrl: './site-form.component.css',
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

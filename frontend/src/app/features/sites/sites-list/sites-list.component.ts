import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SiteService } from '../site.service';
import { Site } from '../../../core/models/site.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sites-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressBarModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './sites-list.component.html',
  styleUrl: './sites-list.component.css',
})
export class SitesListComponent {
  protected auth = inject(AuthService);
  private siteService = inject(SiteService);
  private snack = inject(MatSnackBar);

  cols = ['siteId', 'siteCode', 'name', 'region', 'address', 'status', 'actions'];
  sites = signal<Site[]>([]);
  loading = signal(true);

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.siteService.list().subscribe({
      next: (sites) => { this.sites.set(sites); this.loading.set(false); },
      error: (err: any) => {
        this.loading.set(false);
        const msg = err?.message ?? err?.statusText ?? 'unknown';
        this.snack.open('Could not load sites: ' + msg, 'OK', { duration: 4000 });
      },
    });
  }
}

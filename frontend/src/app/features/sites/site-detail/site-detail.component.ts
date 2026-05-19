import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

import { SiteService } from '../site.service';
import { Site } from '../../../core/models/site.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatDividerModule,
  ],
  template: `
    <div class="page">
      <a mat-button routerLink="/sites"><mat-icon>arrow_back</mat-icon> Back to sites</a>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (site(); as s) {
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>{{ s.name }}</mat-card-title>
            <mat-card-subtitle>{{ s.siteCode }} · {{ s.region || 'No region' }}</mat-card-subtitle>
            <span class="spacer"></span>
            <mat-chip [class.status-active]="s.status === 'ACTIVE'"
                      [class.status-maint]="s.status === 'MAINTENANCE'"
                      [class.status-inactive]="s.status === 'INACTIVE'">{{ s.status }}</mat-chip>
          </mat-card-header>

          <mat-card-content>
            <dl class="fields">
              <dt>Address</dt><dd>{{ s.address || '—' }}</dd>
              <dt>Latitude</dt><dd>{{ s.latitude ?? '—' }}</dd>
              <dt>Longitude</dt><dd>{{ s.longitude ?? '—' }}</dd>
            </dl>
          </mat-card-content>

          <mat-card-actions>
            @if (auth.hasRole('ADMIN', 'MANAGER')) {
              <a mat-button color="primary" [routerLink]="['/sites', s.siteId, 'edit']">
                <mat-icon>edit</mat-icon> Edit
              </a>
            }
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .detail-card { margin-top: 16px; }
    mat-card-header .spacer { flex: 1 1 auto; }
    .fields { display: grid; grid-template-columns: 140px 1fr; row-gap: 6px; column-gap: 16px; }
    dt { color: rgba(0,0,0,.6); font-weight: 500; }
    dd { margin: 0; }
    .status-active   { background: #e8f5e9; color: #2e7d32; }
    .status-maint    { background: #fff3e0; color: #ef6c00; }
    .status-inactive { background: #ffebee; color: #c62828; }
  `,
})
export class SiteDetailComponent implements OnInit {
  @Input() id?: string;
  private siteService = inject(SiteService);
  protected auth = inject(AuthService);

  site = signal<Site | null>(null);
  loading = signal(true);

  ngOnInit() {
    if (!this.id) return;
    this.siteService.get(+this.id).subscribe({
      next: (s) => { this.site.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

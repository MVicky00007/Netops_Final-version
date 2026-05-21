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
  template: `
    <div class="page">
      <div class="header">
        <h1>Sites</h1>
        <span class="spacer"></span>
        @if (auth.hasRole('ADMIN', 'MANAGER')) {
          <a mat-flat-button color="primary" routerLink="new">
            <mat-icon>add</mat-icon> New site
          </a>
        }
      </div>

      <mat-card>
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <table mat-table [dataSource]="sites()" class="full-width">
          <ng-container matColumnDef="siteId">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let s">{{ s.siteId }}</td>
          </ng-container>

          <ng-container matColumnDef="siteCode">
            <th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let s">{{ s.siteCode }}</td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let s">{{ s.name }}</td>
          </ng-container>

          <ng-container matColumnDef="region">
            <th mat-header-cell *matHeaderCellDef>Region</th>
            <td mat-cell *matCellDef="let s">{{ s.region || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>Address</th>
            <td mat-cell *matCellDef="let s">{{ s.address || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let s">
              <mat-chip [class.status-active]="s.status === 'ACTIVE'"
                        [class.status-maint]="s.status === 'MAINTENANCE'"
                        [class.status-inactive]="s.status === 'INACTIVE'">
                {{ s.status }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <a mat-icon-button [routerLink]="[s.siteId]" matTooltip="View">
                <mat-icon>visibility</mat-icon>
              </a>
              @if (auth.hasRole('ADMIN', 'MANAGER')) {
                <a mat-icon-button [routerLink]="[s.siteId, 'edit']" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </a>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty" [attr.colspan]="cols.length">No sites yet.</td>
          </tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: `
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; align-items: center; margin-bottom: 16px; }
    .header h1 { margin: 0; }
    .spacer { flex: 1 1 auto; }
    .full-width { width: 100%; }
    .empty { text-align: center; padding: 32px; color: rgba(0,0,0,.5); }
    .status-active   { background: #e8f5e9; color: #2e7d32; }
    .status-maint    { background: #fff3e0; color: #ef6c00; }
    .status-inactive { background: #ffebee; color: #c62828; }
  `,
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

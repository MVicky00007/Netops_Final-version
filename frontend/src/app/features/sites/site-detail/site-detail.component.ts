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
  templateUrl: './site-detail.component.html',
  styleUrl: './site-detail.component.css',
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

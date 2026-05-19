import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="wrap">
      <mat-icon class="big">block</mat-icon>
      <h1>403 — Forbidden</h1>
      <p>You don't have permission to view this page.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  styles: `
    .wrap { display: grid; place-items: center; min-height: 60vh; gap: 8px; }
    .big { font-size: 80px; height: 80px; width: 80px; color: #c62828; }
  `,
})
export class ForbiddenComponent {}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
  ],
  template: `
    <div class="login-wrap">
      <mat-card class="login-card">
        <div class="brand">
          <div class="logo"><mat-icon>cell_tower</mat-icon></div>
          <span class="brand-name">NetOpsOne</span>
        </div>

        <mat-card-content>
          <h2>Sign in</h2>
          <p class="muted">Welcome back. Enter your details to continue.</p>

          @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

          <form (ngSubmit)="submit()" #f="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hide() ? 'password' : 'text'" name="password"
                     [(ngModel)]="password" required autocomplete="current-password">
              <button type="button" mat-icon-button matSuffix (click)="hide.set(!hide())">
                <mat-icon>{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (errorMsg()) {
              <div class="error-banner">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMsg() }}</span>
              </div>
            }

            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn"
                    [disabled]="!f.form.valid || loading()">
              @if (loading()) { Signing in… } @else { Sign in }
            </button>
          </form>

          <div class="alt-actions">
            <a mat-button routerLink="/signup">Create an account</a>
            <a mat-button routerLink="/forgot-password">Forgot password?</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login-wrap { min-height: 100vh; display: grid; place-items: center;
                  background: #f4f6fa; padding: 24px; }

    .login-card { width: 100%; max-width: 400px;
                  padding: 28px 28px 20px !important;
                  border-radius: 10px !important;
                  box-shadow: 0 4px 20px rgba(15,23,42,.08) !important; }

    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .logo { width: 32px; height: 32px; border-radius: 8px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #fff; display: grid; place-items: center; }
    .logo mat-icon { font-size: 18px !important; height: 18px !important; width: 18px !important; }
    .brand-name { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }

    h2 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
    .muted { font-size: 13px; color: var(--text-muted); margin: 0 0 20px; }

    .full-width { width: 100%; }
    form { display: flex; flex-direction: column; gap: 4px; }
    .submit-btn { height: 42px !important; font-weight: 500 !important;
                  margin-top: 8px; border-radius: 6px !important; }

    .error-banner { display: flex; align-items: center; gap: 8px;
                    background: var(--danger-bg); color: var(--danger-fg);
                    padding: 8px 10px; border-radius: 6px;
                    margin-bottom: 8px; font-size: 12.5px; }
    .error-banner mat-icon { font-size: 16px !important; height: 16px !important; width: 16px !important; }

    .alt-actions { display: flex; justify-content: space-between; align-items: center;
                   margin-top: 16px; padding-top: 16px;
                   border-top: 1px solid var(--border-soft); }
    .alt-actions a { font-size: 12px !important; }
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  email = '';
  password = '';
  hide = signal(true);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  ngOnInit() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'expired') {
      this.errorMsg.set('Your session has expired. Please sign in again.');
    }
  }

  submit() {
    this.errorMsg.set(null);
    this.loading.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.snack.open('Welcome back!', 'OK', { duration: 2000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMsg.set(this.explainError(err));
      },
    });
  }

  /** Translate an HTTP error into a message that actually tells the user what's wrong. */
  private explainError(err: any): string {
    const status = err?.status ?? 0;
    const body = typeof err?.error === 'string' ? err.error : (err?.error?.message ?? '');

    switch (status) {
      case 0:
        return 'Cannot reach the backend. Is the gateway running on http://localhost:9097? '
             + 'Check that the 7 services are up.';
      case 401:
        return body || 'Wrong email or password.';
      case 403:
        return body || 'Your account is inactive or suspended. Contact an admin.';
      case 404:
        return 'Login endpoint not found — gateway route is misconfigured.';
      case 503:
        return 'Service temporarily unavailable. The gateway can\'t reach user-service. '
             + 'Wait ~30 seconds for Eureka registration and try again.';
      case 504:
        return 'Gateway timeout — user-service did not respond.';
      default:
        return `Login failed (HTTP ${status}). ${body}`.trim();
    }
  }
}

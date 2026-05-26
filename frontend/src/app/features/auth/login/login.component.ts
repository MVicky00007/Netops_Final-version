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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
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

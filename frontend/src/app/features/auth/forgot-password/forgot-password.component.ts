import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  email = '';
  newPassword = '';
  confirmPassword = '';
  hidePassword = true;
  msg = signal<string | null>(null);
  isError = signal(false);
  submitting = signal(false);

  submit() {
    if (this.newPassword !== this.confirmPassword) {
      this.isError.set(true);
      this.msg.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.msg.set(null);

    this.auth.forgotPassword({
      email: this.email,
      newPassword: this.newPassword,
    }).subscribe({
      next: (text) => {
        this.submitting.set(false);
        this.isError.set(false);
        this.msg.set(text || 'Password updated successfully.');
        this.snack.open('Password reset — please log in with your new password', 'OK', { duration: 4000 });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.submitting.set(false);
        this.isError.set(true);
        const text = typeof err?.error === 'string' ? err.error : (err?.error?.message ?? 'Reset failed.');
        this.msg.set(text);
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule,
  ],
  template: `
    <div class="signup-wrap">
      <mat-card class="signup-card">
        <mat-card-header>
          <mat-card-title>Create account</mat-card-title>
          <mat-card-subtitle>You'll be active after an admin approves</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="submit()" #f="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full name</mat-label>
              <input matInput name="name" [(ngModel)]="name" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone</mat-label>
              <input matInput name="phone" [(ngModel)]="phone">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Role</mat-label>
              <mat-select name="role" [(ngModel)]="role" required>
                @for (r of roles; track r) { <mat-option [value]="r">{{ r }}</mat-option> }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" name="password" [(ngModel)]="password" required minlength="4">
            </mat-form-field>

            @if (msg()) { <p [class.error]="isError()">{{ msg() }}</p> }

            <button mat-flat-button color="primary" type="submit" class="full-width"
                    [disabled]="!f.form.valid">Sign up</button>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Already have an account? Log in</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .signup-wrap { min-height: 100vh; display: grid; place-items: center; background: #eceff1; }
    .signup-card { width: 420px; max-width: 92vw; }
    .full-width { width: 100%; }
    form { display: flex; flex-direction: column; gap: 4px; }
    .error { color: #c62828; }
    p { font-size: 14px; margin: 4px 0 12px; }
  `,
})
export class SignupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  name = ''; email = ''; phone = ''; password = '';
  role: UserRole = 'NETWORK_ENGINEER';
  roles: UserRole[] = ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'];
  msg = signal<string | null>(null);
  isError = signal(false);

  submit() {
    this.auth.signup({
      name: this.name, email: this.email, password: this.password,
      phone: this.phone, role: this.role,
    }).subscribe({
      next: (text) => {
        this.isError.set(false);
        this.msg.set(text);
        this.snack.open('Account created — wait for admin approval', 'OK', { duration: 4000 });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isError.set(true);
        this.msg.set(typeof err?.error === 'string' ? err.error : 'Sign up failed.');
      },
    });
  }
}

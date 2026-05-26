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
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
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

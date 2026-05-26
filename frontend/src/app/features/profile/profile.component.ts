import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressBarModule, MatDividerModule, MatChipsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  // Reactive state
  user = signal<User | null>(null);
  loading = signal(true);
  saving = signal(false);
  changingPassword = signal(false);
  msg = signal<string | null>(null);
  isError = signal(false);

  // Form model for profile edit
  form = {
    name: '',
    phone: '',
  };

  // Form model for password change
  pw = {
    newPassword: '',
    confirmPassword: '',
  };
  hidePassword = true;

  // Derived initials for the avatar
  initials = computed(() => {
    const u = this.user();
    if (!u?.name) return '?';
    return u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  });

  ngOnInit() {
    this.loadUser();
  }

  /** Find the logged-in user by matching their JWT email against the /users list. */
  private loadUser() {
    const myEmail = this.auth.email();
    if (!myEmail) {
      this.loading.set(false);
      this.isError.set(true);
      this.msg.set('Could not determine your email from the session. Please log in again.');
      return;
    }

    this.loading.set(true);
    this.api.users().subscribe({
      next: (list) => {
        const me = (list as User[]).find((u) => u.email === myEmail) ?? null;
        this.user.set(me);
        if (me) {
          this.form.name = me.name ?? '';
          this.form.phone = me.phone ?? '';
        } else {
          this.isError.set(true);
          this.msg.set('Your account could not be found.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.isError.set(true);
        this.msg.set(typeof err?.error === 'string' ? err.error : 'Could not load your profile.');
      },
    });
  }

  /** PUT /update-profile with the new name + phone (keeping role/email unchanged). */
  saveProfile() {
    const me = this.user();
    if (!me) return;

    this.saving.set(true);
    this.msg.set(null);

    this.auth.updateProfile(me.email, {
      name: this.form.name,
      phone: this.form.phone,
      email: me.email,
      role: me.role,
    }).subscribe({
      next: (text) => {
        this.saving.set(false);
        this.isError.set(false);
        this.msg.set(text || 'Profile updated.');
        // Refresh local copy
        this.user.set({ ...me, name: this.form.name, phone: this.form.phone });
        this.snack.open('Profile saved', 'OK', { duration: 2500 });
      },
      error: (err) => {
        this.saving.set(false);
        this.isError.set(true);
        const text = typeof err?.error === 'string' ? err.error : (err?.error?.message ?? 'Save failed.');
        this.msg.set(text);
      },
    });
  }

  /**
   * Change password reuses POST /forgot-password since that's the only password
   * mutation endpoint the user-service exposes. After success the user is
   * forced to log in again so a fresh JWT is issued.
   */
  changePassword() {
    const me = this.user();
    if (!me) return;
    if (this.pw.newPassword !== this.pw.confirmPassword) {
      this.isError.set(true);
      this.msg.set('Passwords do not match.');
      return;
    }

    this.changingPassword.set(true);
    this.msg.set(null);

    this.auth.forgotPassword({
      email: me.email,
      newPassword: this.pw.newPassword,
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.snack.open('Password updated — please log in again', 'OK', { duration: 4000 });
        // Force a fresh login so the new password takes effect
        setTimeout(() => {
          this.auth.logout();
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.isError.set(true);
        const text = typeof err?.error === 'string' ? err.error : (err?.error?.message ?? 'Password change failed.');
        this.msg.set(text);
      },
    });
  }
}

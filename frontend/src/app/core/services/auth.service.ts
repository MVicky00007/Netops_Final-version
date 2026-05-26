import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ForgotPasswordRequest,
  LoginRequest,
  UserRequest,
  UserRole,
} from '../models/user.model';

interface JwtPayload {
  sub: string;          // email
  role: UserRole;
  iat: number;
  exp: number;
}

const TOKEN_KEY = 'netops.jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Reactive signals so the UI can react to login/logout instantly
  readonly token = signal<string | null>(this.readToken());
  readonly payload = computed<JwtPayload | null>(() => this.decode(this.token()));
  readonly isLoggedIn = computed(() => !!this.payload() && !this.isExpired(this.payload()));
  readonly email = computed(() => this.payload()?.sub ?? null);
  readonly role = computed(() => this.payload()?.role ?? null);

  // ── Auth API ─────────────────────────────────────────────────────────
  login(body: LoginRequest): Observable<string> {
    // Wipe any stale token first so this attempt starts from a clean slate.
    // (Without this, a lingering expired token in localStorage can confuse
    //  the guards/interceptors mid-flight.)
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);

    // user-service returns the raw JWT string as the body
    return this.http
      .post(`${environment.apiUrl}/login`, body, { responseType: 'text' })
      .pipe(tap((jwt) => this.storeToken(jwt)));
  }

  signup(body: UserRequest): Observable<string> {
    return this.http.post(`${environment.apiUrl}/signup`, body, { responseType: 'text' });
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${environment.apiUrl}/forgot-password`, body, { responseType: 'text' });
  }

  /**
   * Update the profile of the user identified by `email`. The backend takes
   * the email as a query param and the new field values in the body.
   * Returns the raw text response from the server.
   */
  updateProfile(email: string, body: Partial<UserRequest>): Observable<string> {
    const url = `${environment.apiUrl}/update-profile?email=${encodeURIComponent(email)}`;
    return this.http.put(url, body, { responseType: 'text' });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }

  // ── Role helpers ─────────────────────────────────────────────────────
  hasRole(...roles: UserRole[]): boolean {
    const r = this.role();
    return r != null && roles.includes(r);
  }

  // ── Internals ────────────────────────────────────────────────────────
  private storeToken(jwt: string) {
    localStorage.setItem(TOKEN_KEY, jwt);
    this.token.set(jwt);
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private decode(jwt: string | null): JwtPayload | null {
    if (!jwt) return null;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    try {
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isExpired(p: JwtPayload | null): boolean {
    return !p || Date.now() / 1000 >= p.exp;
  }
}

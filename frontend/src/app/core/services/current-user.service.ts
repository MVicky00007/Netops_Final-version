import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

/**
 * The backend JWT only contains the user's email + role, not their numeric ID.
 * Many endpoints (creating a fault, submitting a plan, etc.) need the ID, so we
 * fetch the user list once after login and cache the current user's ID locally.
 *
 * Important: the cache is keyed by the email that was authenticated at the time
 * we resolved it. If the user logs out and logs back in as someone else, the
 * stored email won't match `auth.email()` and we'll re-resolve. That avoids the
 * "I see another user's tasks" bug after a session switch.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  readonly userId = signal<number | null>(null);
  private cachedFor: string | null = null;

  /** Resolve current user's numeric id. Cached per email; auto-invalidated on user switch. */
  resolveId(): Observable<number | null> {
    const currentEmail = this.auth.email();

    // Cache hit — but only if the cached id was resolved for the SAME email.
    if (this.userId() != null && this.cachedFor === currentEmail) {
      return of(this.userId());
    }

    // Drop the stale cache (different user is now logged in).
    this.userId.set(null);
    this.cachedFor = null;

    return new Observable((sub) => {
      this.api.users().subscribe({
        next: (users) => {
          const me = users.find((u) => u.email === currentEmail);
          const id = me?.userId ?? null;
          this.userId.set(id);
          this.cachedFor = currentEmail;
          sub.next(id);
          sub.complete();
        },
        error: () => { sub.next(null); sub.complete(); },
      });
    });
  }

  /** Clear cache (call on logout). */
  reset() {
    this.userId.set(null);
    this.cachedFor = null;
  }
}

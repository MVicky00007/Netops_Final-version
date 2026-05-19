import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

/**
 * The backend JWT only contains the user's email + role, not their numeric ID.
 * Many endpoints (creating a fault, submitting a plan, etc.) need the ID, so we
 * fetch the user list once after login and cache the current user's ID locally.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  readonly userId = signal<number | null>(null);

  /** Resolve current user's numeric id. Cached after the first successful call. */
  resolveId(): Observable<number | null> {
    if (this.userId() != null) return of(this.userId());
    return new Observable((sub) => {
      this.api.users().subscribe({
        next: (users) => {
          const me = users.find((u) => u.email === this.auth.email());
          const id = me?.userId ?? null;
          this.userId.set(id);
          sub.next(id);
          sub.complete();
        },
        error: () => { sub.next(null); sub.complete(); },
      });
    });
  }

  /** Clear cache on logout. */
  reset() { this.userId.set(null); }
}

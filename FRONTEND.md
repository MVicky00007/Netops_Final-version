# Frontend Documentation — Angular 18

The frontend is an Angular 18 single-page application that talks to the backend through the Spring Cloud Gateway on port 9097. It uses Angular Material 18 for UI, signals for reactive state, and standalone components throughout (no NgModules).

---

## Table of contents
1. [Tech stack](#1-tech-stack)
2. [Folder layout](#2-folder-layout)
3. [How the app boots](#3-how-the-app-boots)
4. [Authentication — `AuthService` + signals](#4-authentication--authservice--signals)
5. [HTTP interceptors — auth + error](#5-http-interceptors--auth--error)
6. [Route guards — auth + role](#6-route-guards--auth--role)
7. [Role-aware layout](#7-role-aware-layout)
8. [Role-specific dashboards](#8-role-specific-dashboards)
9. [The shared data layer — `ApiService`](#9-the-shared-data-layer--apiservice)
10. [List pages — the reusable pattern](#10-list-pages--the-reusable-pattern)
11. [Mutating data — dialogs + inline actions](#11-mutating-data--dialogs--inline-actions)
12. [`CurrentUserService` — getting your numeric ID](#12-currentuserservice--getting-your-numeric-id)
13. [Environment + CORS](#13-environment--cors)
14. [Request flow end-to-end](#14-request-flow-end-to-end)

---

## 1. Tech stack

| | Version | Why |
|---|---|---|
| Angular | 18 | Standalone components, signals, modern control flow (`@if`/`@for`) |
| Angular Material | 18 | Pre-built components: dialogs, tables, menus, snackbars |
| TypeScript | 5.5 (strict) | Compile-time safety |
| RxJS | 7.8 | HTTP + reactive plumbing |
| Build tool | esbuild (Angular CLI default) | Fast dev server hot-reload |

Standalone components means **no `NgModule`**. Each component declares its own imports:

```typescript
@Component({
  selector: 'app-sites-list',
  standalone: true,          // ← key word
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule, ...
  ],
  template: `<app-data-table [columns]="cols" [rows]="rows()" />`,
})
export class SitesListComponent { ... }
```

---

## 2. Folder layout

```
frontend/src/app/
├── app.component.{ts,html,scss}      # bare <router-outlet> shell
├── app.config.ts                      # HttpClient + interceptors + router + animations
├── app.routes.ts                      # all 30 routes (lazy-loaded)
├── core/
│   ├── models/                        # TypeScript interfaces (User, Site, ApiResponse, ...)
│   ├── services/
│   │   ├── auth.service.ts            # JWT storage + signals
│   │   ├── api.service.ts             # every backend endpoint, one place
│   │   ├── current-user.service.ts    # resolves your numeric userId once
│   │   └── dashboard.service.ts       # parallel-loads all dashboard stats
│   ├── interceptors/
│   │   ├── auth.interceptor.ts        # attaches Bearer token
│   │   └── error.interceptor.ts       # 401 → bounce to /login
│   └── guards/
│       ├── auth.guard.ts              # blocks anon from /app/**
│       └── role.guard.ts              # blocks wrong role from /admin/**
├── features/
│   ├── auth/                          # login, signup
│   ├── layout/                        # top bar + role-aware sidebar
│   ├── dashboard/                     # role-specific home page
│   ├── sites/                         # list, detail, form (CRUD)
│   ├── nodes/                         # list
│   ├── vendors/                       # list
│   ├── fault-reports/                 # list + report dialog + status update
│   ├── tickets/                       # list + status update
│   ├── capacity/                      # plans + records + dialogs + approve/reject
│   ├── health-checks/                 # list
│   ├── kpis/                          # list + new-KPI dialog
│   ├── reports/                       # list + generate-report dialog
│   ├── tasks/                         # list + status update
│   ├── notifications/                 # list
│   ├── admin/                         # users / pending / audit-log
│   └── misc/                          # forbidden + coming-soon placeholder
└── shared/
    └── data-table.component.ts        # reusable list table used by 12+ pages
```

---

## 3. How the app boots

### `main.ts` (entrypoint)
```typescript
bootstrapApplication(AppComponent, appConfig);
```

### `app.config.ts`
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

- `provideRouter(routes, withComponentInputBinding())` — wires up routing AND lets route params/data bind automatically to `@Input()` properties (used in `SiteFormComponent`, etc.)
- `provideHttpClient(withInterceptors([...]))` — registers our auth + error interceptors so they run on every HTTP request
- `provideAnimationsAsync()` — required by Angular Material

### `app.component.html`
```html
<router-outlet />
```
Yep, that's it. The root component is just a router outlet — the actual UI lives in feature components loaded via routes.

---

## 4. Authentication — `AuthService` + signals

The whole auth state lives in **one service** with **Angular signals** (reactive primitives).

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // ── Reactive state ─────────────────────────────────────────────
  readonly token     = signal<string | null>(this.readToken());
  readonly payload   = computed(() => this.decode(this.token()));
  readonly isLoggedIn= computed(() => !!this.payload() && !this.isExpired(this.payload()));
  readonly email     = computed(() => this.payload()?.sub  ?? null);
  readonly role      = computed(() => this.payload()?.role ?? null);

  // ── API ─────────────────────────────────────────────────────────
  login(body) {
    localStorage.removeItem(TOKEN_KEY);     // clear stale token first
    this.token.set(null);
    return this.http.post(`${env.apiUrl}/login`, body, { responseType: 'text' })
                    .pipe(tap(jwt => this.storeToken(jwt)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.role();
    return r != null && roles.includes(r);
  }

  // ── Internals ──────────────────────────────────────────────────
  private storeToken(jwt: string) {
    localStorage.setItem(TOKEN_KEY, jwt);
    this.token.set(jwt);
  }

  private decode(jwt: string | null): JwtPayload | null {
    if (!jwt) return null;
    const json = atob(jwt.split('.')[1]);
    return JSON.parse(json) as JwtPayload;   // { sub: email, role, iat, exp }
  }

  private isExpired(p) { return !p || Date.now() / 1000 >= p.exp; }
}
```

**Why signals?** Any template can react instantly:

```html
<!-- Layout top bar — `auth.email()` updates on its own when login/logout happens -->
<span>{{ auth.email() }}</span>
<span class="role-pill">{{ auth.role() }}</span>
```

No subscriptions, no `async` pipe, no manual change-detection. The values *just stay current*.

---

## 5. HTTP interceptors — auth + error

Interceptors are functions that wrap every outgoing HTTP request.

### `auth.interceptor.ts` — attaches the JWT
```typescript
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Don't send a stale token to public auth endpoints.
  if (PUBLIC_PATHS.some(p => req.url.endsWith(p))) return next(req);

  const token = auth.token();
  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
```

So every API call (except `/login`, `/signup`, `/forgot-password`) automatically gets:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### `error.interceptor.ts` — handles 401 globally
```typescript
const AUTH_ENDPOINTS = ['/login', '/signup', '/forgot-password'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthEndpoint = AUTH_ENDPOINTS.some(p => req.url.endsWith(p));

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 on a normal API call = JWT expired / invalid → boot to /login
      if (err.status === 401 && !isAuthEndpoint) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { reason: 'expired' } });
      }
      // 403 = permission denied for this endpoint, NOT session problem → propagate
      return throwError(() => err);
    })
  );
};
```

> **Why not redirect on 403?** Because Spring returns 403 in two cases: token expired AND permission denied. If we redirected on every 403, a non-admin user would get kicked off the dashboard the moment its widget fetched `/users` (admin-only).

---

## 6. Route guards — auth + role

```typescript
// auth.guard.ts — gate the whole /app/** subtree
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

// role.guard.ts — gate specific routes by role
export const roleGuard = (allowed: UserRole[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(...allowed)) return true;
  router.navigate(['/forbidden']);
  return false;
};
```

Used in `app.routes.ts`:
```typescript
{ path: 'admin/users',
  canActivate: [roleGuard(['ADMIN'])],
  loadComponent: () => import('...').then(m => m.AdminUsersListComponent) }

{ path: 'capacity-plans',
  canActivate: [roleGuard(['ADMIN', 'MANAGER', 'NETWORK_ENGINEER'])],
  loadComponent: () => import('...').then(m => m.CapacityPlansListComponent) }
```

If a `FIELD_ENGINEER` types `/admin/users` into the URL bar, the guard fires and redirects them to `/forbidden`.

---

## 7. Role-aware layout

The sidebar is built from a config array. Each item carries an optional `roles` whitelist.

```typescript
private sections: NavSection[] = [
  { label: 'Overview', items: [
      { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },   // no roles → everyone
  ]},
  { label: 'Infrastructure', items: [
      { label: 'Sites',   icon: 'business', route: '/sites',
          roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'] },
      { label: 'Nodes',   icon: 'router',   route: '/nodes',
          roles: ['ADMIN', 'NETWORK_ENGINEER', 'FIELD_ENGINEER'] },
      { label: 'Vendors', icon: 'store',    route: '/vendors',
          roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER'] },
  ]},
  { label: 'Admin', items: [
      { label: 'Users',     icon: 'group',           route: '/admin/users',
          roles: ['ADMIN'] },
      { label: 'Approvals', icon: 'pending_actions', route: '/admin/pending-users',
          roles: ['ADMIN'] },
      { label: 'Audit log', icon: 'history',         route: '/admin/audit-logs',
          roles: ['ADMIN', 'AUDITOR'] },
  ]},
  // ...
];

visibleSections(): NavSection[] {
  return this.sections
    .map(s => ({ ...s, items: s.items.filter(i => !i.roles || this.auth.hasRole(...i.roles)) }))
    .filter(s => s.items.length > 0);
}
```

Template renders the filtered tree:
```html
@for (section of visibleSections(); track section.label) {
  <div class="section-label">{{ section.label }}</div>
  @for (item of section.items; track item.route) {
    <a class="nav-item" [routerLink]="item.route" routerLinkActive="active">
      <mat-icon>{{ item.icon }}</mat-icon>
      <span>{{ item.label }}</span>
    </a>
  }
}
```

A `FIELD_ENGINEER` literally **cannot see** "Vendors" or "Capacity plans" in their sidebar. The `roleGuard` then prevents direct URL access.

---

## 8. Role-specific dashboards

The dashboard component has ONE template — but the **stat cards**, **activity feed**, and **quick actions** are computed differently per role:

```typescript
statCards(): StatCard[] {
  const s = this.stats();
  if (!s) return [];

  if (this.auth.hasRole('ADMIN')) {
    return [
      { label: 'Users',     value: s.users,        icon: 'group',           color: 'primary', route: '/admin/users' },
      { label: 'Pending',   value: s.pendingUsers, icon: 'pending_actions', color: 'warn',    route: '/admin/pending-users' },
      { label: 'Sites',     value: s.sites,        icon: 'business',        color: 'info',    route: '/sites' },
      { label: 'Open faults', value: s.openFaults, icon: 'report_problem',  color: 'warn',    route: '/fault-reports' },
      // ...
    ];
  }
  if (this.auth.hasRole('MANAGER')) {
    return [
      { label: 'To approve', value: s.pendingApprovalPlans, icon: 'rule',  color: 'warn',    route: '/capacity-plans' },
      { label: 'Open tickets', value: s.openTickets,        icon: '...',   color: 'primary', route: '/tickets' },
      // ...
    ];
  }
  if (this.auth.hasRole('NETWORK_ENGINEER')) { return [/* fault + capacity focus */]; }
  if (this.auth.hasRole('FIELD_ENGINEER'))   { return [/* tasks + faults focus */]; }
  return [/* AUDITOR default — audit + reports + KPIs */];
}
```

The hero banner colour even adapts per role:

```css
.hero-admin   { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); }  /* blue */
.hero-manager { background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%); }  /* purple */
.hero-network { background: linear-gradient(135deg, #065f46 0%, #10b981 100%); }  /* green */
.hero-field   { background: linear-gradient(135deg, #c2410c 0%, #f97316 100%); }  /* orange */
.hero-auditor { background: linear-gradient(135deg, #374151 0%, #6b7280 100%); }  /* gray */
```

### How stats actually load
`DashboardService.loadAll()` fires **15 parallel HTTP requests** with `forkJoin`, wrapping each in a `safe()` helper that swallows errors so a single 403 doesn't kill the whole dashboard:

```typescript
const safe = <T>(obs: Observable<T>, fallback: T) =>
  obs.pipe(catchError(() => of(fallback)));

loadAll(): Observable<DashboardStats> {
  return forkJoin({
    users:        safe(this.http.get<User[]>(`${api}/users`), []),
    pendingUsers: safe(this.http.get<User[]>(`${api}/pending-users`), []),
    sites:        safe(this.http.get<Site[]>(`${api}/sites`), []),
    faults:       safe(this.http.get<ApiResponse<any[]>>(`${api}/api/v1/fault-reports`), { ... }),
    tickets:      safe(this.http.get<ApiResponse<any[]>>(`${api}/api/v1/tickets`), { ... }),
    plans:        safe(this.http.get<ApiResponse<any[]>>(`${api}/capacity-plans`), { ... }),
    // ... 9 more
  }).pipe(map(r => ({ /* aggregate into one DashboardStats object */ })));
}
```

A `MANAGER`'s call to `/users` returns 403 → `safe()` returns `[]` → dashboard shows `0` for users → no error to the user.

---

## 9. The shared data layer — `ApiService`

One service knows how to call **every** backend endpoint:

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;   // http://localhost:9097

  // user-service — raw bodies
  users()          { return this.http.get<any[]>(`${this.base}/users`); }
  approveUser(id)  { return this.http.put(`${this.base}/approve-user?userId=${id}`, {}, { responseType: 'text' }); }

  // incident-service — wrapped in APIResponse<T>
  faultReports()   { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/fault-reports`)); }
  createFaultReport(body) {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/fault-reports`, body).pipe(map(r => r.data));
  }

  // capacity-service — also wrapped
  capacityPlans()       { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/capacity-plans`)); }
  approveCapacityPlan(planId, body) {
    return this.http.post<ApiResponse<any>>(`${this.base}/capacity-plans/${planId}/approve`, body)
                    .pipe(map(r => r.data));
  }
  // ... 30+ more methods
}

function unwrap<T>(obs: Observable<ApiResponse<T[]>>) {
  return obs.pipe(map(r => r?.data ?? []));
}
```

> **Why one service?** Because some endpoints return `APIResponse<T>` (incident/capacity/task) and some return raw bodies (user/site). The `unwrap()` helper hides that difference, so list components always get a flat `Observable<T[]>`.

---

## 10. List pages — the reusable pattern

A typical list page is **~30 lines** because it delegates to the shared `<app-data-table>`:

```typescript
@Component({
  selector: 'app-vendors-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="page">
      <app-data-table
        title="Vendors"
        subtitle="Hardware and service partners"
        entityName="vendors"
        [columns]="cols"
        [rows]="rows()"
        [loading]="loading()" />
    </div>
  `,
})
export class VendorsListComponent implements OnInit {
  private api = inject(ApiService);
  cols: ColumnDef[] = [
    { key: 'vendorId',    label: 'ID',     kind: 'number', width: '60px' },
    { key: 'name',        label: 'Vendor' },
    { key: 'contactInfo', label: 'Contact' },
    { key: 'contractRef', label: 'Contract' },
    { key: 'status',      label: 'Status', kind: 'status' },
  ];
  rows = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.vendors().subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
```

### The shared `<app-data-table>`
```typescript
@Component({
  selector: 'app-data-table',
  inputs: ['title', 'subtitle', 'columns', 'rows', 'loading'],
  template: `
    <div class="dt-card">
      <div class="dt-head">...</div>
      @if (loading) { <mat-progress-bar mode="indeterminate" /> }
      <table class="dt">
        <thead><tr>@for (c of columns; track c.key) { <th>{{ c.label }}</th> }</tr></thead>
        <tbody>
          @for (row of rows; track $index) {
            <tr>
              @for (c of columns; track c.key) {
                <td>
                  @switch (c.kind) {
                    @case ('date')     { <span class="muted">{{ row[c.key] | date:'short' }}</span> }
                    @case ('status')   { <span class="pill" [class]="'pill-' + (row[c.key] | lowercase)">{{ row[c.key] }}</span> }
                    @case ('priority') { <span class="pri" [class]="'pri-' + (row[c.key] | lowercase)">{{ row[c.key] }}</span> }
                    @case ('number')   { <span class="num">{{ row[c.key] }}</span> }
                    @case ('bool')     { @if (row[c.key]) { <mat-icon class="bool-y">check_circle</mat-icon> } @else { ... } }
                    @default           { <span>{{ row[c.key] ?? '—' }}</span> }
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
```

The `kind` property tells it how to render: a `status` cell becomes a coloured pill, `priority` becomes a P1/P2/P3/P4 badge, `date` formats nicely.

This component saves ~150 lines per list page × 12 pages ≈ 1800 lines of duplicate code.

---

## 11. Mutating data — dialogs + inline actions

For **create** flows, we use Material's `MatDialog`:

```typescript
// In the list component:
openCreate() {
  const ref = this.dialog.open(FaultReportFormDialog, { width: '480px' });
  ref.afterClosed().subscribe(created => {
    if (created) {
      this.snack.open('Fault reported', 'OK', { duration: 2500 });
      this.refresh();
    }
  });
}

// The dialog itself:
@Component({
  selector: 'app-fault-report-form-dialog',
  standalone: true,
  template: `
    <h2 mat-dialog-title>Report a new fault</h2>
    <form #f="ngForm" (ngSubmit)="submit()">
      <mat-dialog-content class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Site ID</mat-label>
          <input matInput type="number" name="siteId" [(ngModel)]="model.siteId" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select name="severity" [(ngModel)]="model.severity" required>
            @for (s of severities; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <!-- ... -->
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit">Report fault</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class FaultReportFormDialog {
  private ref = inject(MatDialogRef<FaultReportFormDialog>);
  private api = inject(ApiService);
  private currentUser = inject(CurrentUserService);

  submit() {
    this.api.createFaultReport({
      reportedById: this.currentUser.userId(),
      siteId: this.model.siteId,
      severity: this.model.severity,
      description: this.model.description,
    }).subscribe({
      next: () => this.ref.close(true),  // closing with `true` tells the parent to refresh
    });
  }
}
```

For **status updates** (no form needed), the row gets a 3-dot menu:

```html
<button mat-icon-button [matMenuTriggerFor]="m">
  <mat-icon>more_vert</mat-icon>
</button>
<mat-menu #m="matMenu">
  <button mat-menu-item (click)="updateStatus(t.taskId, 'IN_PROGRESS')">Start</button>
  <button mat-menu-item (click)="updateStatus(t.taskId, 'COMPLETED')">Mark completed</button>
  <button mat-menu-item (click)="updateStatus(t.taskId, 'CANCELLED')">Cancel</button>
</mat-menu>
```

```typescript
updateStatus(taskId: number, status: string) {
  this.api.updateTaskStatus(taskId, status).subscribe({
    next: () => { this.snack.open(`Task marked ${status}`); this.refresh(); },
  });
}
```

### Action buttons are role-gated
Every action is wrapped in `@if (auth.hasRole(...))`:
```html
@if (auth.hasRole('ADMIN', 'MANAGER')) {
  <button mat-flat-button color="primary" (click)="openCreate()">
    <mat-icon>add</mat-icon> New site
  </button>
}
```

A NETWORK_ENGINEER on `/sites` literally cannot *see* the "New site" button because `hasRole('ADMIN', 'MANAGER')` returns false.

---

## 12. `CurrentUserService` — getting your numeric ID

The JWT only carries `email` and `role`. But many endpoints need a numeric `userId` (e.g. "who's submitting this capacity plan?"). We fetch `/users` once after login and cache the answer:

```typescript
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  readonly userId = signal<number | null>(null);

  resolveId(): Observable<number | null> {
    if (this.userId() != null) return of(this.userId());
    return new Observable(sub => {
      this.api.users().subscribe({
        next: users => {
          const me = users.find(u => u.email === this.auth.email());
          const id = me?.userId ?? null;
          this.userId.set(id);
          sub.next(id);
          sub.complete();
        },
      });
    });
  }
}
```

Used in the submit handler:
```typescript
submit() {
  const userId = this.currentUser.userId();   // already cached
  this.api.createCapacityPlan({ ...this.model, requestedBy: userId }).subscribe(...);
}
```

Note: `/users` is admin-only on the backend. Non-admin users will get a 403 here — that's why we fall back to userId=1 for the `tasks/user/{id}` call in `TasksListComponent`. A production app would expose a `/me` endpoint that returns the current user without admin privileges.

---

## 13. Environment + CORS

### `environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9097',   // ← always the gateway
};
```

The frontend **never** talks to a service directly (`localhost:9101`, `9102`, etc.). It only knows about the gateway.

### CORS — handled by the backend
The frontend sets no CORS headers (it can't). The gateway's `application.yml` permits any localhost origin:

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOriginPatterns:
              - "http://localhost:*"
              - "http://127.0.0.1:*"
            allowedMethods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
```

This is why login from `http://localhost:4200` (or `60208` from VS Code's preview pane) all work.

---

## 14. Request flow end-to-end

What happens when a logged-in NETWORK_ENGINEER clicks "Report new fault":

```
1. Browser submits dialog form
   └─> FaultReportFormDialog.submit()
       └─> api.createFaultReport({ reportedById: 10, siteId: 1, ... })
           └─> http.post('http://localhost:9097/api/v1/fault-reports', body)

2. authInterceptor runs
   └─> Adds header:  Authorization: Bearer eyJhbGc...

3. Browser sends preflight OPTIONS request first (CORS)
   └─> Gateway responds with Access-Control-Allow-Origin: http://localhost:4200
   └─> Browser proceeds with the real POST.

4. Spring Cloud Gateway (port 9097)
   └─> Matches predicate: Path=/api/v1/fault-reports/**
   └─> Forwards to lb://incident-service
   └─> Resolves via Eureka → incident-service on port 9103
   └─> Forwards the JWT header along

5. incident-service (port 9103)
   └─> JwtFilter parses the Bearer token, sets SecurityContext (email + role)
   └─> Spring Security checks @PreAuthorize / .authenticated() — passes
   └─> FaultReportController.createFaultReport(body)
       └─> Validates @Valid request body
       └─> FaultReportServiceImpl.createFaultReport()
           └─> Loads User + Site from JPA (via common's repos)
           └─> Builds FaultReport entity, saves
           └─> Maps to FaultReportResponse DTO
       └─> Wraps in APIResponse<FaultReportResponse>

6. Response bubbles back: incident-service → gateway → browser

7. authInterceptor + errorInterceptor see the response (no errors, no special handling)

8. .subscribe(next:) in the dialog fires
   └─> ref.close(true)
   └─> Parent component's afterClosed() fires
       └─> snack.open('Fault reported')
       └─> refresh() reloads the list
```

This whole flow is ~120ms in dev mode. Multiple times faster than the equivalent monolith because the gateway streams the response and the per-service contexts are smaller.

---

## Common gotchas while developing

| Symptom | Likely cause | Fix |
|---|---|---|
| All requests fail with CORS error | Gateway not restarted after CORS config change | `Ctrl+C` the gateway terminal and `./mvnw -pl api-gateway spring-boot:run` again |
| `Login failed` even with right password | Stale JWT in localStorage, **previous bug** | Already fixed: `login()` clears localStorage first |
| Random port instead of 4200 | Another `npm start` instance running | `Get-NetTCPConnection -LocalPort 4200 | Stop-Process -Force` |
| 403 keeps redirecting to /login | **Old bug**: 403 was treated as session-expired | Already fixed: only 401 triggers logout now |
| Dashboard widget shows 0 for a role | Endpoint returned 403 for that role — `safe()` falls back to 0 | This is by design — non-admin can't see `/users` count |
| Brand-new test user shows "Account pending" on login | Backend signs you up as INACTIVE | An admin must approve via `/admin/pending-users` |
| Browser shows old UI after code change | Cached bundle | `Ctrl+Shift+R` for hard reload |
| Material component looks broken | Material theme not loaded | Check `styles.scss` has `@import "@angular/material/prebuilt-themes/azure-blue.css"` |

---

That's the whole frontend. ~30 components, ~800 lines of business logic, ~15 HTTP endpoints — all built on the same patterns: signals, standalone components, role-aware filtering, shared data-table, dialog-based mutations.

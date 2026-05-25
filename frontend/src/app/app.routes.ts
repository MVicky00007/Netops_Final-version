import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const comingSoon = (feature: string) =>
  import('./features/misc/coming-soon.component').then(m => m.ComingSoonComponent);

// ── Role bundles ─────────────────────────────────────────────────────
const ALL  = ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'] as const;
const TECH = ['ADMIN', 'NETWORK_ENGINEER', 'FIELD_ENGINEER'] as const;
const OPS  = ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER'] as const;
const MGMT = ['ADMIN', 'MANAGER', 'AUDITOR'] as const;

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────────
  { path: 'login',           loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup',          loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent) },
  { path: 'forgot-password', loadComponent: () => comingSoon('Forgot password') },
  { path: 'forbidden',       loadComponent: () => import('./features/misc/forbidden.component').then(m => m.ForbiddenComponent) },

  // ── Protected app shell ─────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      { path: 'dashboard',     loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile',       loadComponent: () => comingSoon('Profile') },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications-list.component').then(m => m.NotificationsListComponent) },

      // ── Sites (everyone can view; ADMIN/MANAGER can edit) ────────
      { path: 'sites',          canActivate: [roleGuard([...ALL])],
        loadComponent: () => import('./features/sites/sites-list/sites-list.component').then(m => m.SitesListComponent) },
      { path: 'sites/new',      canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () => import('./features/sites/site-form/site-form.component').then(m => m.SiteFormComponent) },
      { path: 'sites/:id',      canActivate: [roleGuard([...ALL])],
        loadComponent: () => import('./features/sites/site-detail/site-detail.component').then(m => m.SiteDetailComponent) },
      { path: 'sites/:id/edit', canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () => import('./features/sites/site-form/site-form.component').then(m => m.SiteFormComponent) },

      // ── Nodes / Interfaces ────────────────────────────────────
      { path: 'nodes',      canActivate: [roleGuard([...TECH])],
        loadComponent: () => import('./features/nodes/nodes-list.component').then(m => m.NodesListComponent) },
      { path: 'interfaces', canActivate: [roleGuard([...TECH])],
        loadComponent: () => import('./features/interfaces/interfaces-list.component').then(m => m.InterfacesListComponent) },
      // (Vendors module removed from scope — see PROBLEM_STATEMENT.pdf §4.2.)

      // ── Incidents (visible to everyone) ──────────────────────────
      { path: 'fault-reports', canActivate: [roleGuard([...ALL])],
        loadComponent: () => import('./features/fault-reports/fault-reports-list.component').then(m => m.FaultReportsListComponent) },
      { path: 'tickets',       canActivate: [roleGuard([...ALL])],
        loadComponent: () => import('./features/tickets/tickets-list.component').then(m => m.TicketsListComponent) },

      // ── Capacity (admin / manager / network engineer) ────────────
      { path: 'capacity-plans',   canActivate: [roleGuard([...OPS])],
        loadComponent: () => import('./features/capacity/capacity-plans-list.component').then(m => m.CapacityPlansListComponent) },
      { path: 'capacity-records', canActivate: [roleGuard([...OPS])],
        loadComponent: () => import('./features/capacity/capacity-records-list.component').then(m => m.CapacityRecordsListComponent) },

      // ── Monitoring ──────────────────────────────────────────────
      { path: 'health-checks', canActivate: [roleGuard(['ADMIN', 'NETWORK_ENGINEER', 'AUDITOR'])],
        loadComponent: () => import('./features/health-checks/health-checks-list.component').then(m => m.HealthChecksListComponent) },
      { path: 'kpis',          canActivate: [roleGuard([...MGMT])],
        loadComponent: () => import('./features/kpis/kpis-list.component').then(m => m.KpisListComponent) },
      { path: 'reports',       canActivate: [roleGuard([...MGMT])],
        loadComponent: () => import('./features/reports/reports-list.component').then(m => m.ReportsListComponent) },

      // ── Personal ───────────────────────────────────────────────
      { path: 'tasks', canActivate: [roleGuard([...TECH])],
        loadComponent: () => import('./features/tasks/tasks-list.component').then(m => m.TasksListComponent) },

      // ── Admin-only ─────────────────────────────────────────────
      { path: 'admin/users',         canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin/users-list.component').then(m => m.AdminUsersListComponent) },
      { path: 'admin/pending-users', canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin/pending-users.component').then(m => m.PendingUsersComponent) },
      { path: 'admin/audit-logs',    canActivate: [roleGuard(['ADMIN', 'AUDITOR'])],
        loadComponent: () => import('./features/admin/audit-log.component').then(m => m.AuditLogComponent) },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];

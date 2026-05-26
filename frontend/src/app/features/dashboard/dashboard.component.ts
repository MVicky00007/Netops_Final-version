import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { UserRole } from '../../core/models/user.model';

interface StatCard {
  label: string; value: number; icon: string;
  color: 'primary' | 'success' | 'warn' | 'info' | 'purple';
  route?: string; subtitle?: string;
}
interface QuickAction { label: string; icon: string; route: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, DatePipe,
    MatIconModule, MatButtonModule, MatChipsModule,
    MatProgressBarModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  protected auth = inject(AuthService);
  private dash = inject(DashboardService);

  now = new Date();
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.dash.loadAll(null).subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  userName(): string {
    const email = this.auth.email() ?? '';
    return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  roleClass(): string {
    return ({
      ADMIN: 'admin', MANAGER: 'manager',
      NETWORK_ENGINEER: 'network', FIELD_ENGINEER: 'field', AUDITOR: 'auditor',
    } as Record<UserRole, string>)[this.auth.role() as UserRole] ?? 'admin';
  }

  // ── Stats per role ───────────────────────────────────────────────
  statCards(): StatCard[] {
    const s = this.stats();
    if (!s) return [];

    if (this.auth.hasRole('ADMIN')) {
      return [
        { label: 'Users',             value: s.users,              icon: 'group',           color: 'primary', route: '/admin/users' },
        { label: 'Pending',           value: s.pendingUsers,       icon: 'pending_actions', color: 'warn',    route: '/admin/pending-users', subtitle: s.pendingUsers ? 'Action' : 'Clear' },
        { label: 'Sites',             value: s.sites,              icon: 'business',        color: 'info',    route: '/sites' },
        { label: 'Open faults',       value: s.openFaults,         icon: 'report_problem',  color: 'warn',    route: '/fault-reports' },
        { label: 'Open tickets',      value: s.openTickets,        icon: 'confirmation_number', color: 'purple', route: '/tickets' },
        { label: 'Health checks',     value: s.activeHealthChecks, icon: 'monitor_heart',   color: 'success', route: '/health-checks' },
      ];
    }
    if (this.auth.hasRole('MANAGER')) {
      return [
        { label: 'To approve',  value: s.pendingApprovalPlans, icon: 'rule',                color: 'warn',    route: '/capacity-plans' },
        { label: 'Open tickets',value: s.openTickets,          icon: 'confirmation_number', color: 'primary', route: '/tickets' },
        { label: 'Open faults', value: s.openFaults,           icon: 'report_problem',      color: 'warn',    route: '/fault-reports' },
        { label: 'Sites',       value: s.sites,                icon: 'business',            color: 'info',    route: '/sites' },
        { label: 'KPIs',        value: s.kpis,                 icon: 'leaderboard',         color: 'purple',  route: '/kpis' },
        { label: 'Reports',     value: s.reports,              icon: 'description',         color: 'success', route: '/reports' },
      ];
    }
    if (this.auth.hasRole('NETWORK_ENGINEER')) {
      return [
        { label: 'Open faults',   value: s.openFaults,         icon: 'report_problem',      color: 'warn',    route: '/fault-reports' },
        { label: 'Open tickets',  value: s.openTickets,        icon: 'confirmation_number', color: 'primary', route: '/tickets' },
        { label: 'Health checks', value: s.activeHealthChecks, icon: 'monitor_heart',       color: 'success', route: '/health-checks' },
        { label: 'My tasks',      value: s.myTasks,            icon: 'assignment',          color: 'info',    route: '/tasks', subtitle: s.myPendingTasks ? `${s.myPendingTasks} pending` : 'Done' },
        { label: 'Plans',         value: s.capacityPlans,      icon: 'trending_up',         color: 'purple',  route: '/capacity-plans' },
        { label: 'Sites',         value: s.sites,              icon: 'business',            color: 'info',    route: '/sites' },
      ];
    }
    if (this.auth.hasRole('FIELD_ENGINEER')) {
      return [
        { label: 'My tasks',      value: s.myTasks,                icon: 'assignment',     color: 'primary', route: '/tasks' },
        { label: 'Pending',       value: s.myPendingTasks,         icon: 'pending',        color: 'warn',    route: '/tasks', subtitle: s.myPendingTasks ? 'Action' : '' },
        { label: 'Unread',        value: s.myUnreadNotifications,  icon: 'notifications',  color: 'info',    route: '/notifications' },
        { label: 'Open faults',   value: s.openFaults,             icon: 'report_problem', color: 'warn',    route: '/fault-reports' },
        { label: 'Sites',         value: s.sites,                  icon: 'business',       color: 'success', route: '/sites' },
      ];
    }
    return [
      { label: 'Audit entries', value: s.recentAuditLogs.length, icon: 'history',     color: 'primary', route: '/admin/audit-logs' },
      { label: 'KPIs',          value: s.kpis,                   icon: 'leaderboard', color: 'purple',  route: '/kpis' },
      { label: 'Reports',       value: s.reports,                icon: 'description', color: 'info',    route: '/reports' },
      { label: 'Sites',         value: s.sites,                  icon: 'business',    color: 'success', route: '/sites' },
      { label: 'Open tickets',  value: s.openTickets,            icon: 'confirmation_number', color: 'warn', route: '/tickets' },
    ];
  }

  // ── Quick actions per role ───────────────────────────────────────
  quickActions(): QuickAction[] {
    if (this.auth.hasRole('ADMIN')) {
      return [
        { label: 'Manage users', icon: 'group',           route: '/admin/users' },
        { label: 'Approvals',    icon: 'pending_actions', route: '/admin/pending-users' },
        { label: 'New site',     icon: 'add_business',    route: '/sites/new' },
        { label: 'Audit log',    icon: 'history',         route: '/admin/audit-logs' },
      ];
    }
    if (this.auth.hasRole('MANAGER')) {
      return [
        { label: 'Approve plans', icon: 'rule',         route: '/capacity-plans' },
        { label: 'New ticket',    icon: 'add_circle',   route: '/tickets/new' },
        { label: 'New KPI',       icon: 'leaderboard',  route: '/kpis/new' },
        { label: 'New report',    icon: 'description',  route: '/reports/new' },
      ];
    }
    if (this.auth.hasRole('NETWORK_ENGINEER')) {
      return [
        { label: 'Report fault',  icon: 'report',         route: '/fault-reports/new' },
        { label: 'Capacity rec',  icon: 'speed',          route: '/capacity-records/new' },
        { label: 'Health check',  icon: 'play_circle',    route: '/health-checks' },
        { label: 'New plan',      icon: 'trending_up',    route: '/capacity-plans/new' },
      ];
    }
    if (this.auth.hasRole('FIELD_ENGINEER')) {
      return [
        { label: 'My tasks',     icon: 'assignment',          route: '/tasks' },
        { label: 'Report fault', icon: 'report',              route: '/fault-reports/new' },
        { label: 'Tickets',      icon: 'confirmation_number', route: '/tickets' },
        { label: 'Sites',        icon: 'business',            route: '/sites' },
      ];
    }
    return [
      { label: 'Audit log', icon: 'history',     route: '/admin/audit-logs' },
      { label: 'Reports',   icon: 'description', route: '/reports' },
      { label: 'KPIs',      icon: 'leaderboard', route: '/kpis' },
      { label: 'Sites',     icon: 'business',    route: '/sites' },
    ];
  }

  // ── Activity feed metadata ───────────────────────────────────────
  activityTitle(): string {
    if (this.auth.hasRole('ADMIN') && (this.stats()?.recentAuditLogs?.length ?? 0) > 0) return 'Recent activity';
    if (this.auth.hasRole('ADMIN'))   return 'Pending approvals';
    if (this.auth.hasRole('AUDITOR')) return 'Recent audit log';
    return 'Recent sites';
  }

  activitySubtitle(): string {
    if (this.auth.hasRole('ADMIN') && (this.stats()?.recentAuditLogs?.length ?? 0) > 0) return 'Last 5 audited actions';
    if (this.auth.hasRole('ADMIN'))   return 'New signups awaiting review';
    if (this.auth.hasRole('AUDITOR')) return 'Tamper-evident audit trail';
    return 'Sites in your scope';
  }

  activityLink(): string {
    if (this.auth.hasRole('ADMIN', 'AUDITOR')) return '/admin/audit-logs';
    return '/sites';
  }

  actionIcon(action: string): string {
    const a = action.toUpperCase();
    if (a.startsWith('CREATE')) return 'add_circle';
    if (a.startsWith('UPDATE')) return 'edit';
    if (a.startsWith('DELETE')) return 'delete';
    if (a.includes('APPROVE')) return 'check_circle';
    if (a.includes('REJECT'))  return 'cancel';
    if (a.includes('LOGIN'))   return 'login';
    if (a.includes('UPLOAD'))  return 'upload';
    return 'history';
  }
}

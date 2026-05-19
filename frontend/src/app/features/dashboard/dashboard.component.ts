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
  template: `
    <div class="dashboard">

      <!-- ── Header strip — compact, single line ─────────────────── -->
      <header class="header">
        <div>
          <div class="greeting">{{ greeting() }}, <strong>{{ userName() }}</strong></div>
          <div class="header-meta">
            <span class="role-tag" [class]="'role-' + roleClass()">{{ auth.role() }}</span>
            <span class="dot">·</span>
            <span class="time">{{ now | date:'EEE, d MMM · h:mm a' }}</span>
          </div>
        </div>
        <div class="header-actions">
          @for (a of quickActions().slice(0, 2); track a.route) {
            <a [routerLink]="a.route" class="qa-link">
              <mat-icon>{{ a.icon }}</mat-icon>
              <span>{{ a.label }}</span>
            </a>
          }
        </div>
      </header>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <!-- ── Stats row — compact cards ───────────────────────────── -->
      <section class="stats">
        @for (s of statCards(); track s.label) {
          <a class="stat" [class]="'stat-' + s.color"
             [routerLink]="s.route || null"
             [matTooltip]="s.route ? 'Open ' + s.label : ''">
            <div class="stat-head">
              <mat-icon>{{ s.icon }}</mat-icon>
              <span class="stat-label">{{ s.label }}</span>
            </div>
            <div class="stat-foot">
              <span class="stat-value">{{ s.value }}</span>
              @if (s.subtitle) { <span class="stat-sub">{{ s.subtitle }}</span> }
            </div>
          </a>
        }
      </section>

      <!-- ── Two-col body ────────────────────────────────────────── -->
      <section class="body">

        <!-- LEFT — activity feed -->
        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">{{ activityTitle() }}</div>
              <div class="panel-sub">{{ activitySubtitle() }}</div>
            </div>
            <a class="see-all" [routerLink]="activityLink()">View all
              <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
          <div class="panel-body">

            @if (auth.hasRole('ADMIN', 'AUDITOR') && stats()?.recentAuditLogs?.length) {
              @for (log of stats()!.recentAuditLogs; track log.logId) {
                <div class="row-item">
                  <div class="row-icon icon-info">
                    <mat-icon>{{ actionIcon(log.action) }}</mat-icon>
                  </div>
                  <div class="row-body">
                    <div class="row-title">
                      <strong>{{ log.action }}</strong> <span class="muted">on {{ log.resourceType }}</span>
                    </div>
                    <div class="row-meta">{{ log.userName || 'system' }} · {{ log.timestamp | date:'short' }}</div>
                  </div>
                </div>
              }
            } @else if (auth.hasRole('ADMIN') && stats()?.pendingUsersList?.length) {
              @for (u of stats()!.pendingUsersList; track u.userId) {
                <div class="row-item">
                  <div class="row-icon icon-warn">
                    <mat-icon>person_add</mat-icon>
                  </div>
                  <div class="row-body">
                    <div class="row-title">{{ u.name }} <span class="muted">· {{ u.role }}</span></div>
                    <div class="row-meta">{{ u.email }}</div>
                  </div>
                  <a class="row-action" routerLink="/admin/pending-users">Review</a>
                </div>
              }
            } @else if (stats()?.recentSites?.length) {
              @for (s of stats()!.recentSites; track s.siteId) {
                <a class="row-item link" [routerLink]="['/sites', s.siteId]">
                  <div class="row-icon icon-primary">
                    <mat-icon>business</mat-icon>
                  </div>
                  <div class="row-body">
                    <div class="row-title">{{ s.name }}</div>
                    <div class="row-meta">{{ s.siteCode }} · {{ s.region || 'No region' }}</div>
                  </div>
                  <span class="status-pill" [class]="'pill-' + s.status.toLowerCase()">{{ s.status }}</span>
                </a>
              }
            } @else if (!loading()) {
              <div class="empty">
                <mat-icon>inbox</mat-icon>
                <p>Nothing to show yet.</p>
              </div>
            }

          </div>
        </div>

        <!-- RIGHT — quick actions + inbox -->
        <div class="right-col">

          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">Quick actions</div>
            </div>
            <div class="qa-grid">
              @for (a of quickActions(); track a.route) {
                <a class="qa-tile" [routerLink]="a.route">
                  <mat-icon>{{ a.icon }}</mat-icon>
                  <span>{{ a.label }}</span>
                </a>
              }
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><div class="panel-title">Your inbox</div></div>
            <div class="panel-body inbox">
              <a class="inbox-row" routerLink="/tasks">
                <mat-icon class="ib-icon">assignment</mat-icon>
                <div class="ib-body">
                  <div class="ib-title">My tasks</div>
                  <div class="ib-sub">{{ stats()?.myPendingTasks || 0 }} pending · {{ stats()?.myTasks || 0 }} total</div>
                </div>
                @if (stats()?.myPendingTasks) { <span class="badge">{{ stats()!.myPendingTasks }}</span> }
              </a>
              <a class="inbox-row" routerLink="/notifications">
                <mat-icon class="ib-icon">notifications</mat-icon>
                <div class="ib-body">
                  <div class="ib-title">Notifications</div>
                  <div class="ib-sub">{{ stats()?.myUnreadNotifications || 0 }} unread</div>
                </div>
                @if (stats()?.myUnreadNotifications) { <span class="badge">{{ stats()!.myUnreadNotifications }}</span> }
              </a>
              <a class="inbox-row" routerLink="/profile">
                <mat-icon class="ib-icon">account_circle</mat-icon>
                <div class="ib-body">
                  <div class="ib-title">Profile</div>
                  <div class="ib-sub">{{ auth.email() }}</div>
                </div>
              </a>
            </div>
          </div>

        </div>
      </section>
    </div>
  `,
  styles: `
    .dashboard { padding: 16px 20px 32px; max-width: 1400px; margin: 0 auto; }

    /* ── Compact header strip ─────────────────────────────────────── */
    .header { display: flex; align-items: center; justify-content: space-between;
              gap: 16px; margin-bottom: 16px; }
    .greeting { font-size: 18px; font-weight: 500; color: var(--text-primary);
                letter-spacing: -0.01em; }
    .greeting strong { font-weight: 700; }
    .header-meta { display: flex; align-items: center; gap: 6px;
                   margin-top: 3px; font-size: 11.5px; color: var(--text-muted); }
    .role-tag { font-size: 10px; font-weight: 600; padding: 1.5px 6px;
                border-radius: 4px; letter-spacing: 0.04em; text-transform: uppercase; }
    .role-admin   { background: rgba(30,58,138,.10); color: #1e3a8a; }
    .role-manager { background: rgba(91,33,182,.10); color: #6d28d9; }
    .role-network { background: rgba(6,95,70,.10);   color: #065f46; }
    .role-field   { background: rgba(194,65,12,.10); color: #c2410c; }
    .role-auditor { background: rgba(55,65,81,.10);  color: #374151; }
    .dot { opacity: 0.5; }

    .header-actions { display: flex; gap: 6px; }
    .qa-link { display: inline-flex; align-items: center; gap: 5px;
               padding: 6px 10px; border-radius: 6px;
               background: #fff; border: 1px solid var(--border-line);
               color: var(--text-secondary); font-size: 12px; font-weight: 500;
               transition: all .12s ease; }
    .qa-link:hover { background: var(--brand-50); border-color: var(--brand-500);
                     color: var(--brand-700); }
    .qa-link mat-icon { font-size: 14px !important; height: 14px !important; width: 14px !important; }

    /* ── Stat cards — dense ───────────────────────────────────────── */
    .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
             gap: 10px; margin-bottom: 16px; }
    .stat { display: flex; flex-direction: column; gap: 10px;
            background: #fff; padding: 12px 14px;
            border-radius: 8px; border: 1px solid var(--border-soft);
            text-decoration: none; color: inherit;
            transition: transform .12s ease, box-shadow .12s ease,
                        border-color .12s ease; }
    .stat:hover { transform: translateY(-1px); box-shadow: var(--shadow-3);
                  border-color: var(--brand-500); }
    .stat-head { display: flex; align-items: center; gap: 6px; color: var(--text-muted); }
    .stat-head mat-icon { font-size: 14px !important; height: 14px !important; width: 14px !important; }
    .stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
                  text-transform: uppercase; }
    .stat-foot  { display: flex; align-items: baseline; gap: 8px; }
    .stat-value { font-size: 22px; font-weight: 700; line-height: 1;
                  letter-spacing: -0.02em; color: var(--text-primary); }
    .stat-sub   { font-size: 10px; color: var(--text-faint); font-weight: 500;
                  text-transform: uppercase; letter-spacing: 0.03em; }

    .stat-primary .stat-head mat-icon { color: var(--brand-600); }
    .stat-success .stat-head mat-icon { color: var(--success-fg); }
    .stat-warn    .stat-head mat-icon { color: var(--warn-fg); }
    .stat-info    .stat-head mat-icon { color: var(--info-fg); }
    .stat-purple  .stat-head mat-icon { color: #6d28d9; }

    /* ── Two-column body ─────────────────────────────────────────── */
    .body { display: grid; grid-template-columns: minmax(0,2fr) minmax(0,1fr); gap: 12px;
            align-items: start; }
    @media (max-width: 960px) { .body { grid-template-columns: 1fr; } }
    .right-col { display: flex; flex-direction: column; gap: 12px; }

    /* ── Panel (replaces mat-card for tighter control) ───────────── */
    .panel { background: #fff; border-radius: 8px; border: 1px solid var(--border-soft);
             overflow: hidden; }
    .panel-head { display: flex; align-items: center; justify-content: space-between;
                  padding: 12px 14px; border-bottom: 1px solid var(--border-soft); }
    .panel-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .panel-sub   { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
    .see-all { display: inline-flex; align-items: center; gap: 3px;
               font-size: 11px; color: var(--brand-600); font-weight: 500; }
    .see-all mat-icon { font-size: 12px !important; height: 12px !important; width: 12px !important; }
    .panel-body { padding: 4px 0; }

    /* ── Row items ───────────────────────────────────────────────── */
    .row-item { display: flex; align-items: center; gap: 10px;
                padding: 9px 14px; border-bottom: 1px solid var(--border-soft);
                color: inherit; text-decoration: none; }
    .row-item:last-child { border-bottom: none; }
    .row-item.link { cursor: pointer; }
    .row-item.link:hover { background: rgba(15,23,42,.025); }

    .row-icon { width: 28px; height: 28px; border-radius: 6px;
                display: grid; place-items: center; flex-shrink: 0; }
    .row-icon mat-icon { font-size: 14px !important; height: 14px !important; width: 14px !important; }
    .icon-primary { background: var(--brand-50); }
    .icon-primary mat-icon { color: var(--brand-600); }
    .icon-info { background: var(--info-bg); }
    .icon-info mat-icon { color: var(--info-fg); }
    .icon-warn { background: var(--warn-bg); }
    .icon-warn mat-icon { color: var(--warn-fg); }

    .row-body { flex: 1 1 auto; min-width: 0; }
    .row-title { font-size: 12.5px; font-weight: 500; color: var(--text-primary);
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-meta  { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

    .row-action { font-size: 11px; font-weight: 600; color: var(--brand-600);
                  padding: 4px 8px; border-radius: 4px; }
    .row-action:hover { background: var(--brand-50); }

    .status-pill { font-size: 10px; font-weight: 600; padding: 2px 7px;
                   border-radius: 4px; letter-spacing: 0.03em; text-transform: uppercase; }
    .pill-active      { background: var(--success-bg); color: var(--success-fg); }
    .pill-maintenance { background: var(--warn-bg);    color: var(--warn-fg); }
    .pill-inactive    { background: var(--danger-bg);  color: var(--danger-fg); }

    .empty { padding: 28px 16px; text-align: center; color: var(--text-faint); }
    .empty mat-icon { font-size: 28px !important; height: 28px !important; width: 28px !important; }
    .empty p { margin: 6px 0 0; font-size: 12px; }

    /* ── Quick actions tile grid ─────────────────────────────────── */
    .qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
               background: var(--border-soft); padding: 1px; }
    .qa-tile { background: #fff; padding: 14px 10px; display: flex;
               flex-direction: column; align-items: center; gap: 6px;
               text-decoration: none; color: var(--text-secondary);
               font-size: 11px; font-weight: 500; text-align: center;
               transition: background .12s ease, color .12s ease; }
    .qa-tile:hover { background: var(--brand-50); color: var(--brand-700); }
    .qa-tile mat-icon { font-size: 18px !important; height: 18px !important; width: 18px !important;
                        color: var(--text-faint); }
    .qa-tile:hover mat-icon { color: var(--brand-600); }

    /* ── Inbox rows ──────────────────────────────────────────────── */
    .inbox-row { display: flex; align-items: center; gap: 10px;
                 padding: 10px 14px; border-bottom: 1px solid var(--border-soft);
                 color: inherit; text-decoration: none; }
    .inbox-row:last-child { border-bottom: none; }
    .inbox-row:hover { background: rgba(15,23,42,.025); }
    .ib-icon { color: var(--brand-600); }
    .ib-body { flex: 1 1 auto; min-width: 0; }
    .ib-title { font-size: 12.5px; font-weight: 500; }
    .ib-sub   { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
    .badge    { background: var(--danger-fg); color: #fff;
                font-size: 10px; font-weight: 700;
                min-width: 18px; height: 18px; border-radius: 9px;
                display: grid; place-items: center; padding: 0 5px; }
  `,
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

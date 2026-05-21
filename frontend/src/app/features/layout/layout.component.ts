import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

interface NavSection { label: string; items: NavItem[]; }
interface NavItem    { label: string; icon: string; route: string; roles?: UserRole[]; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule,
    MatButtonModule, MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="layout">

      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <a routerLink="/dashboard" class="brand">
          <div class="logo"><mat-icon>cell_tower</mat-icon></div>
          <span class="brand-name">NetOpsOne</span>
        </a>

        <nav class="nav">
          @for (section of visibleSections(); track section.label) {
            <div class="section">
              <div class="section-label">{{ section.label }}</div>
              @for (item of section.items; track item.route) {
                <a class="nav-item" [routerLink]="item.route" routerLinkActive="active">
                  <mat-icon>{{ item.icon }}</mat-icon>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          }
        </nav>

        <div class="sidenav-footer">v0.0.1 · {{ env }}</div>
      </mat-sidenav>

      <mat-sidenav-content>
        <header class="topbar">
          <button mat-icon-button (click)="sidenav.toggle()" matTooltip="Toggle">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="page-title">{{ pageTitle() }}</span>
          <span class="spacer"></span>

          <button mat-icon-button routerLink="/notifications" matTooltip="Notifications">
            <mat-icon>notifications_none</mat-icon>
          </button>

          <button class="user-btn" [matMenuTriggerFor]="userMenu">
            <div class="avatar">{{ initials() }}</div>
            <div class="user-info">
              <span class="user-name">{{ userName() }}</span>
              <span class="role-pill" [class]="'role-' + roleClass()">{{ auth.role() }}</span>
            </div>
            <mat-icon class="caret">expand_more</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="menu-head">
              <div class="avatar lg">{{ initials() }}</div>
              <div>
                <div class="menu-name">{{ userName() }}</div>
                <div class="menu-email">{{ auth.email() }}</div>
              </div>
            </div>
            <a mat-menu-item routerLink="/profile"><mat-icon>person</mat-icon>My profile</a>
            <a mat-menu-item routerLink="/notifications"><mat-icon>notifications</mat-icon>Notifications</a>
            <a mat-menu-item routerLink="/tasks"><mat-icon>assignment</mat-icon>My tasks</a>
            <mat-divider />
            <button mat-menu-item (click)="logout()" class="signout">
              <mat-icon>logout</mat-icon>Sign out
            </button>
          </mat-menu>
        </header>

        <main class="main"><router-outlet /></main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .layout { height: 100vh; background: var(--bg-page); }

    /* ── Sidenav (220px, dense) ──────────────────────────────────── */
    .sidenav { width: 220px; background: #fff;
               border-right: 1px solid var(--border-soft);
               display: flex; flex-direction: column; }

    .brand { display: flex; align-items: center; gap: 8px;
             padding: 12px 14px; height: 52px;
             border-bottom: 1px solid var(--border-soft);
             color: var(--text-primary); }
    .logo { width: 26px; height: 26px; border-radius: 6px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #fff; display: grid; place-items: center; flex-shrink: 0; }
    .logo mat-icon { font-size: 14px !important; height: 14px !important; width: 14px !important; }
    .brand-name { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }

    .nav { flex: 1 1 auto; overflow-y: auto; padding: 8px 0; }
    .section { margin-bottom: 4px; }
    .section-label { font-size: 10px; font-weight: 600; color: var(--text-faint);
                     text-transform: uppercase; letter-spacing: 0.06em;
                     padding: 10px 16px 4px; }

    .nav-item { display: flex; align-items: center; gap: 10px;
                padding: 6px 10px; margin: 1px 8px;
                border-radius: 6px;
                color: var(--text-secondary);
                font-size: 12.5px; font-weight: 500;
                cursor: pointer; line-height: 1.3;
                transition: background .12s ease, color .12s ease; }
    .nav-item:hover { background: rgba(15,23,42,.04); color: var(--text-primary); }
    .nav-item mat-icon { font-size: 16px !important; height: 16px !important; width: 16px !important;
                         color: var(--text-faint); flex-shrink: 0; }
    .nav-item.active { background: var(--brand-50); color: var(--brand-700); }
    .nav-item.active mat-icon { color: var(--brand-600); }

    .sidenav-footer { padding: 8px 16px; border-top: 1px solid var(--border-soft);
                      color: var(--text-faint); font-size: 10px; letter-spacing: 0.04em; }

    /* ── Top bar (52px, slim) ────────────────────────────────────── */
    .topbar { position: sticky; top: 0; z-index: 10;
              display: flex; align-items: center; gap: 8px;
              padding: 0 14px 0 8px; height: 52px;
              background: #fff; border-bottom: 1px solid var(--border-soft); }
    .page-title { font-size: 14px; font-weight: 600; color: var(--text-primary);
                  margin-left: 4px; }

    .user-btn { display: flex; align-items: center; gap: 8px;
                background: transparent; border: 1px solid transparent;
                padding: 4px 8px 4px 4px; border-radius: 8px; cursor: pointer;
                font: inherit; color: inherit; }
    .user-btn:hover { background: rgba(15,23,42,.04); border-color: var(--border-soft); }

    .avatar { width: 28px; height: 28px; border-radius: 50%;
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: #fff; font-weight: 600; font-size: 11px;
              display: grid; place-items: center; letter-spacing: 0.3px;
              flex-shrink: 0; }
    .avatar.lg { width: 36px; height: 36px; font-size: 13px; }

    .user-info { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
    .user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }

    .role-pill { font-size: 9.5px; font-weight: 600; padding: 1px 6px;
                 border-radius: 4px; margin-top: 1px; letter-spacing: 0.04em;
                 text-transform: uppercase; }
    .role-admin   { background: rgba(30,58,138,.10); color: #1e3a8a; }
    .role-manager { background: rgba(91,33,182,.10); color: #6d28d9; }
    .role-network { background: rgba(6,95,70,.10);   color: #065f46; }
    .role-field   { background: rgba(194,65,12,.10); color: #c2410c; }
    .role-auditor { background: rgba(55,65,81,.10);  color: #374151; }
    .caret { color: var(--text-faint); font-size: 16px !important; height: 16px !important; width: 16px !important; }

    /* ── User menu ───────────────────────────────────────────────── */
    .menu-head { display: flex; align-items: center; gap: 10px;
                 padding: 12px 14px;
                 background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
                 color: #fff; }
    .menu-name  { font-size: 13px; font-weight: 600; }
    .menu-email { font-size: 11px; opacity: 0.85; }
    .signout, .signout mat-icon { color: var(--danger-fg) !important; }

    /* ── Main content ─────────────────────────────────────────────── */
    .main { min-height: calc(100vh - 52px); background: var(--bg-page); }
  `,
})
export class LayoutComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  protected env = 'dev';

  // ── Navigation matrix — strict per-role allocation ─────────────────
  //
  //   ADMIN            : everything (full system management)
  //   MANAGER          : work oversight + approvals (no field-ops detail)
  //   NETWORK_ENGINEER : technical work (faults, capacity, health, sites/nodes)
  //   FIELD_ENGINEER   : field work — tasks, sites/nodes, fault reporting
  //   AUDITOR          : read-only review (audit log, reports, KPIs, sites)
  //
  private sections: NavSection[] = [
    { label: 'Overview', items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },   // everyone
    ]},
    { label: 'Infrastructure', items: [
        { label: 'Sites',      icon: 'business',  route: '/sites',
            roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'] },
        { label: 'Nodes',      icon: 'router',    route: '/nodes',
            roles: ['ADMIN', 'NETWORK_ENGINEER', 'FIELD_ENGINEER'] },
        { label: 'Interfaces', icon: 'cable',     route: '/interfaces',
            roles: ['ADMIN', 'NETWORK_ENGINEER', 'FIELD_ENGINEER'] },
    ]},
    { label: 'Incidents', items: [
        { label: 'Fault reports', icon: 'report_problem',      route: '/fault-reports',
            roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'] },
        { label: 'Tickets',       icon: 'confirmation_number', route: '/tickets',
            roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER', 'FIELD_ENGINEER', 'AUDITOR'] },
    ]},
    { label: 'Capacity', items: [
        { label: 'Plans',   icon: 'trending_up', route: '/capacity-plans',
            roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER'] },
        { label: 'Records', icon: 'speed',       route: '/capacity-records',
            roles: ['ADMIN', 'MANAGER', 'NETWORK_ENGINEER'] },
    ]},
    { label: 'Monitoring', items: [
        { label: 'Health checks', icon: 'monitor_heart', route: '/health-checks',
            roles: ['ADMIN', 'NETWORK_ENGINEER', 'AUDITOR'] },
        { label: 'KPIs',          icon: 'leaderboard',   route: '/kpis',
            roles: ['ADMIN', 'MANAGER', 'AUDITOR'] },
        { label: 'Reports',       icon: 'description',   route: '/reports',
            roles: ['ADMIN', 'MANAGER', 'AUDITOR'] },
    ]},
    { label: 'Personal', items: [
        { label: 'My tasks',      icon: 'assignment',    route: '/tasks',
            roles: ['ADMIN', 'NETWORK_ENGINEER', 'FIELD_ENGINEER'] },
        { label: 'Notifications', icon: 'notifications', route: '/notifications' },   // everyone
    ]},
    { label: 'Admin', items: [
        { label: 'Users',     icon: 'group',           route: '/admin/users',
            roles: ['ADMIN'] },
        { label: 'Approvals', icon: 'pending_actions', route: '/admin/pending-users',
            roles: ['ADMIN'] },
        { label: 'Audit log', icon: 'history',         route: '/admin/audit-logs',
            roles: ['ADMIN', 'AUDITOR'] },
    ]},
  ];

  visibleSections(): NavSection[] {
    return this.sections
      .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || this.auth.hasRole(...i.roles)) }))
      .filter((s) => s.items.length > 0);
  }

  initials(): string { return (this.auth.email() ?? '').substring(0, 2).toUpperCase(); }

  userName(): string {
    const email = this.auth.email() ?? '';
    return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  roleClass(): string {
    return ({
      ADMIN: 'admin', MANAGER: 'manager',
      NETWORK_ENGINEER: 'network', FIELD_ENGINEER: 'field', AUDITOR: 'auditor',
    } as Record<UserRole, string>)[this.auth.role() as UserRole] ?? 'admin';
  }

  pageTitle(): string {
    const url = this.router.url.split('?')[0].split('/').filter(Boolean);
    if (!url.length) return 'Dashboard';
    const map: Record<string, string> = {
      dashboard: 'Dashboard', sites: 'Sites', nodes: 'Edge nodes',
      vendors: 'Vendors', 'fault-reports': 'Fault reports', tickets: 'Tickets',
      'capacity-plans': 'Capacity plans', 'capacity-records': 'Capacity records',
      'health-checks': 'Health checks', kpis: 'KPIs', reports: 'Reports',
      tasks: 'My tasks', notifications: 'Notifications', profile: 'Profile',
      admin: 'Administration',
    };
    return map[url[0]] ?? url[0].charAt(0).toUpperCase() + url[0].slice(1);
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}

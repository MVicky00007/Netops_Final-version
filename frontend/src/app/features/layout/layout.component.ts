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
import { CurrentUserService } from '../../core/services/current-user.service';
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
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  protected auth = inject(AuthService);
  private currentUser = inject(CurrentUserService);
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
      'fault-reports': 'Fault reports', tickets: 'Tickets',
      'capacity-plans': 'Capacity plans', 'capacity-records': 'Capacity records',
      'health-checks': 'Health checks', kpis: 'KPIs', reports: 'Reports',
      tasks: 'My tasks', notifications: 'Notifications', profile: 'Profile',
      admin: 'Administration',
    };
    return map[url[0]] ?? url[0].charAt(0).toUpperCase() + url[0].slice(1);
  }

  logout() {
    this.auth.logout();
    this.currentUser.reset();   // critical: drop the cached numeric user id
    this.router.navigate(['/login']);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Site } from '../models/site.model';
import { ApiResponse } from '../models/api-response.model';

export interface DashboardStats {
  // common
  sites: number;
  // admin / manager
  users: number;
  pendingUsers: number;
  // incidents
  openFaults: number;
  openTickets: number;
  // capacity
  capacityPlans: number;
  pendingApprovalPlans: number;
  // health
  activeHealthChecks: number;
  // governance
  kpis: number;
  reports: number;
  recentAuditLogs: AuditLogEntry[];
  // personal
  myTasks: number;
  myPendingTasks: number;
  myUnreadNotifications: number;
  // recents
  recentSites: Site[];
  pendingUsersList: User[];
}

export interface AuditLogEntry {
  logId: number;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  timestamp: string;
}

/** Wrap any HTTP call so a single 401/403/500 doesn't fail the whole forkJoin. */
const safe = <T>(obs: Observable<T>, fallback: T): Observable<T> =>
  obs.pipe(catchError(() => of(fallback)));

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Pulls every stat in parallel. Endpoints the user lacks permission for return 0/[]. */
  loadAll(currentUserId: number | null): Observable<DashboardStats> {
    const meId = currentUserId ?? 0;

    return forkJoin({
      users:        safe(this.http.get<User[]>(`${this.api}/users`), []),
      pendingUsers: safe(this.http.get<User[]>(`${this.api}/pending-users`), []),
      sites:        safe(this.http.get<Site[]>(`${this.api}/sites`), []),
      faults:       safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/fault-reports`),
                         { success: true, message: '', data: [] }),
      tickets:      safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/tickets`),
                         { success: true, message: '', data: [] }),
      plans:        safe(this.http.get<ApiResponse<any[]>>(`${this.api}/capacity-plans`),
                         { success: true, message: '', data: [] }),
      healthActive: safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/health-checks/active`),
                         { success: true, message: '', data: [] }),
      kpis:         safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/kpis`),
                         { success: true, message: '', data: [] }),
      reports:      safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/reports`),
                         { success: true, message: '', data: [] }),
      auditLogs:    safe(this.http.get<AuditLogEntry[]>(`${this.api}/audit-logs`), []),
      myTasks:      safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/tasks/user/${meId}`),
                         { success: true, message: '', data: [] }),
      myPending:    safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/tasks/user/${meId}/pending`),
                         { success: true, message: '', data: [] }),
      myUnread:     safe(this.http.get<ApiResponse<any[]>>(`${this.api}/api/v1/notifications/user/${meId}/unread`),
                         { success: true, message: '', data: [] }),
    }).pipe(
      map((r): DashboardStats => ({
        users: r.users.length,
        pendingUsers: r.pendingUsers.length,
        sites: r.sites.length,
        openFaults: (r.faults.data ?? []).filter((f: any) => f.status === 'OPEN' || f.status === 'IN_PROGRESS').length || (r.faults.data ?? []).length,
        openTickets: (r.tickets.data ?? []).filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length || (r.tickets.data ?? []).length,
        capacityPlans: (r.plans.data ?? []).length,
        pendingApprovalPlans: (r.plans.data ?? []).filter((p: any) => p.status === 'PENDING').length,
        activeHealthChecks: (r.healthActive.data ?? []).length,
        kpis: (r.kpis.data ?? []).length,
        reports: (r.reports.data ?? []).length,
        recentAuditLogs: (r.auditLogs ?? []).slice(0, 5),
        myTasks: (r.myTasks.data ?? []).length,
        myPendingTasks: (r.myPending.data ?? []).length,
        myUnreadNotifications: (r.myUnread.data ?? []).length,
        recentSites: (r.sites ?? []).slice(0, 5),
        pendingUsersList: (r.pendingUsers ?? []).slice(0, 5),
      }))
    );
  }
}

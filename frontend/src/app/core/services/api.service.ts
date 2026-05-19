import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * One service that knows how to call every backend endpoint, regardless of
 * which microservice owns it. Each method returns a flat `Observable<T[]>` so
 * the calling list-component doesn't have to know whether the backend wrapped
 * the body in APIResponse or not.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── user-service (raw bodies) ────────────────────────────────────────
  users():         Observable<any[]> { return this.http.get<any[]>(`${this.base}/users`); }
  pendingUsers():  Observable<any[]> { return this.http.get<any[]>(`${this.base}/pending-users`); }
  approveUser(userId: number): Observable<string> {
    return this.http.put(`${this.base}/approve-user?userId=${userId}`, {}, { responseType: 'text' });
  }
  blockUser(userId: number): Observable<string> {
    return this.http.put(`${this.base}/block-user?userId=${userId}`, {}, { responseType: 'text' });
  }
  updateRole(userId: number, role: string): Observable<string> {
    return this.http.put(`${this.base}/update-role?userId=${userId}&role=${role}`, {}, { responseType: 'text' });
  }

  // ── site-service (raw bodies) ────────────────────────────────────────
  sites():       Observable<any[]> { return this.http.get<any[]>(`${this.base}/sites`); }
  vendors():     Observable<any[]> { return this.http.get<any[]>(`${this.base}/vendors`); }

  /** Nodes don't have a "list all" endpoint — fetch all sites and concat their nodes. */
  nodes(): Observable<any[]> {
    return new Observable<any[]>((sub) => {
      this.sites().subscribe({
        next: (sites) => {
          if (!sites.length) { sub.next([]); sub.complete(); return; }
          let pending = sites.length;
          const all: any[] = [];
          sites.forEach((s) => {
            this.http.get<any[]>(`${this.base}/sites/${s.siteId}/nodes`).subscribe({
              next: (nodes) => {
                nodes.forEach((n) => all.push({ ...n, siteName: s.name, siteCode: s.siteCode }));
                if (--pending === 0) { sub.next(all); sub.complete(); }
              },
              error: () => { if (--pending === 0) { sub.next(all); sub.complete(); } },
            });
          });
        },
        error: (e) => sub.error(e),
      });
    });
  }

  // ── incident-service (APIResponse wrapped) ───────────────────────────
  faultReports(): Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/fault-reports`)); }
  createFaultReport(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/fault-reports`, body).pipe(map((r) => r.data));
  }
  updateFaultStatus(faultId: number, status: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/api/v1/fault-reports/${faultId}?status=${status}`, {}).pipe(map((r) => r.data));
  }

  tickets(): Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/tickets`)); }
  createTicket(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/tickets`, body).pipe(map((r) => r.data));
  }
  updateTicketStatus(ticketId: number, status: string, notes?: string): Observable<any> {
    const url = notes
      ? `${this.base}/api/v1/tickets/${ticketId}?status=${status}&notes=${encodeURIComponent(notes)}`
      : `${this.base}/api/v1/tickets/${ticketId}?status=${status}`;
    return this.http.patch<ApiResponse<any>>(url, {}).pipe(map((r) => r.data));
  }

  notifications(userId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/notifications/user/${userId}`));
  }
  markNotificationRead(id: number): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/api/v1/notifications/${id}/read`, {}).pipe(map((r) => r.data));
  }

  // ── capacity-service ────────────────────────────────────────────────
  capacityPlans():   Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/capacity-plans`)); }
  createCapacityPlan(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/capacity-plans`, body).pipe(map((r) => r.data));
  }
  approveCapacityPlan(planId: number, body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/capacity-plans/${planId}/approve`, body).pipe(map((r) => r.data));
  }

  capacityRecords(): Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/capacity-records`)); }
  createCapacityRecord(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/capacity-records`, body).pipe(map((r) => r.data));
  }

  healthChecks():    Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/health-checks`)); }
  createHealthCheck(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/health-checks`, body).pipe(map((r) => r.data));
  }
  runHealthCheck(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/health-checks/run`, body).pipe(map((r) => r.data));
  }

  kpis():            Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/kpis`)); }
  createKpi(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/kpis`, body).pipe(map((r) => r.data));
  }

  reports():         Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/reports`)); }
  generateReport(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/reports`, body).pipe(map((r) => r.data));
  }

  // ── task-service ─────────────────────────────────────────────────────
  tasks(userId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/tasks/user/${userId}`));
  }
  updateTaskStatus(taskId: number, status: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/api/v1/tasks/${taskId}/status?status=${status}`, {}).pipe(map((r) => r.data));
  }

  auditLogs(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/audit-logs`); }
}

function unwrap<T>(obs: Observable<ApiResponse<T[]>>): Observable<T[]> {
  return obs.pipe(map((r) => r?.data ?? []));
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * One service that knows how to call every backend endpoint, regardless of
 * which microservice owns it. Each method returns a flat `Observable<T[]>` or
 * `Observable<T>` so the calling list-component doesn't have to know whether
 * the backend wrapped the body in APIResponse or not.
 *
 * Coverage is exhaustive — every controller endpoint across user-service,
 * site-service, incident-service, capacity-service and task-service has a
 * matching method here.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ════════════════════════════════════════════════════════════════════
  // user-service (raw bodies — no APIResponse wrapper)
  // ════════════════════════════════════════════════════════════════════
  users():         Observable<any[]> { return this.http.get<any[]>(`${this.base}/users`); }
  pendingUsers():  Observable<any[]> { return this.http.get<any[]>(`${this.base}/pending-users`); }
  approveUser(userId: number): Observable<string> {
    return this.http.put(`${this.base}/approve-user?userId=${userId}`, {}, { responseType: 'text' });
  }
  blockUser(userId: number): Observable<string> {
    return this.http.put(`${this.base}/block-user?userId=${userId}`, {}, { responseType: 'text' });
  }
  unblockUser(userId: number): Observable<string> {
    return this.http.put(`${this.base}/unblock-user?userId=${userId}`, {}, { responseType: 'text' });
  }
  deleteUser(userId: number): Observable<string> {
    return this.http.delete(`${this.base}/users/${userId}`, { responseType: 'text' });
  }
  updateRole(userId: number, role: string): Observable<string> {
    return this.http.put(`${this.base}/update-role?userId=${userId}&role=${role}`, {}, { responseType: 'text' });
  }
  // signup / login / forgot-password / update-profile are handled by AuthService.

  // ════════════════════════════════════════════════════════════════════
  // site-service (raw bodies)
  // ════════════════════════════════════════════════════════════════════
  sites():   Observable<any[]> { return this.http.get<any[]>(`${this.base}/sites`); }
  site(siteId: number): Observable<any> { return this.http.get<any>(`${this.base}/sites/${siteId}`); }
  createSite(body: any): Observable<any> { return this.http.post<any>(`${this.base}/sites`, body); }
  updateSite(siteId: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.base}/sites/${siteId}`, body);
  }

  // Vendors module removed from scope per PROBLEM_STATEMENT.pdf — no `vendors()` method.


  /** Nodes belonging to one site. */
  nodesBySite(siteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/sites/${siteId}/nodes`);
  }
  node(nodeId: number): Observable<any> { return this.http.get<any>(`${this.base}/nodes/${nodeId}`); }
  createNode(siteId: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/nodes?siteID=${siteId}`, body);
  }
  updateNode(nodeId: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.base}/nodes/${nodeId}`, body);
  }

  /** Interfaces belonging to one node. */
  interfacesByNode(nodeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/nodes/${nodeId}/interfaces`);
  }
  createInterface(nodeId: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/nodes/${nodeId}/interfaces`, body);
  }
  updateInterface(ifaceId: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.base}/interfaces/${ifaceId}`, body);
  }

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

  /** Same flatten trick for interfaces: walk all nodes → fetch their interfaces. */
  interfaces(): Observable<any[]> {
    return new Observable<any[]>((sub) => {
      this.nodes().subscribe({
        next: (nodes) => {
          if (!nodes.length) { sub.next([]); sub.complete(); return; }
          let pending = nodes.length;
          const all: any[] = [];
          nodes.forEach((n) => {
            this.interfacesByNode(n.nodeId).subscribe({
              next: (ifs) => {
                ifs.forEach((i) => all.push({
                  ...i,
                  nodeId: n.nodeId,
                  nodeHostname: n.hostname,
                  siteId: n.siteId,
                  siteName: n.siteName,
                }));
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

  // ════════════════════════════════════════════════════════════════════
  // incident-service (APIResponse wrapped)
  // ════════════════════════════════════════════════════════════════════
  faultReports(): Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/fault-reports`)); }
  createFaultReport(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/fault-reports`, body).pipe(map((r) => r.data));
  }
  updateFaultStatus(faultId: number, status: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/api/v1/fault-reports/${faultId}?status=${status}`, {}).pipe(map((r) => r.data));
  }

  tickets(): Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/tickets`)); }
  ticket(ticketId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/api/v1/tickets/${ticketId}`).pipe(map((r) => r.data));
  }
  createTicket(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/tickets`, body).pipe(map((r) => r.data));
  }
  updateTicketStatus(ticketId: number, status: string, notes?: string): Observable<any> {
    const url = notes
      ? `${this.base}/api/v1/tickets/${ticketId}?status=${status}&notes=${encodeURIComponent(notes)}`
      : `${this.base}/api/v1/tickets/${ticketId}?status=${status}`;
    return this.http.patch<ApiResponse<any>>(url, {}).pipe(map((r) => r.data));
  }
  assignTicket(ticketId: number, assignedToId: number): Observable<any> {
    return this.http
      .patch<ApiResponse<any>>(`${this.base}/api/v1/tickets/${ticketId}/assign?assignedToId=${assignedToId}`, {})
      .pipe(map((r) => r.data));
  }

  ticketSla(ticketId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/api/v1/tickets/${ticketId}/sla`).pipe(map((r) => r.data));
  }

  ticketAttachments(ticketId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/tickets/${ticketId}/attachments`));
  }
  uploadTicketAttachment(ticketId: number, body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/tickets/${ticketId}/attachments`, body).pipe(map((r) => r.data));
  }

  notifications(userId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/notifications/user/${userId}`));
  }
  unreadNotifications(userId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/notifications/user/${userId}/unread`));
  }
  createNotification(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/notifications`, body).pipe(map((r) => r.data));
  }
  markNotificationRead(id: number): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/api/v1/notifications/${id}/read`, {}).pipe(map((r) => r.data));
  }

  // ════════════════════════════════════════════════════════════════════
  // capacity-service
  // ════════════════════════════════════════════════════════════════════
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

  // -- change evidence files attached to capacity plans -------------------
  planEvidence(planId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/capacity-plans/${planId}/evidence`));
  }
  /** Upload an evidence file (multipart) to a capacity plan. */
  uploadPlanEvidence(planId: number, file: File, uploadedBy: number, notes?: string): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    form.append('uploadedBy', String(uploadedBy));
    if (notes) form.append('notes', notes);
    return this.http
      .post<ApiResponse<any>>(`${this.base}/capacity-plans/${planId}/evidence`, form)
      .pipe(map((r) => r.data));
  }
  /** Stream a file blob for download. */
  downloadPlanEvidence(planId: number, evidenceId: number): Observable<Blob> {
    return this.http.get(`${this.base}/capacity-plans/${planId}/evidence/${evidenceId}/download`, { responseType: 'blob' });
  }

  // -- health checks ------------------------------------------------------
  healthChecks():    Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/health-checks`)); }
  activeHealthChecks(): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/health-checks/active`));
  }
  healthCheck(checkId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/api/v1/health-checks/${checkId}`).pipe(map((r) => r.data));
  }
  createHealthCheck(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/health-checks`, body).pipe(map((r) => r.data));
  }
  updateHealthCheck(checkId: number, body: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.base}/api/v1/health-checks/${checkId}`, body).pipe(map((r) => r.data));
  }
  runHealthCheck(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/health-checks/run`, body).pipe(map((r) => r.data));
  }
  healthCheckRuns(checkId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/health-checks/${checkId}/runs`));
  }

  // -- KPIs ---------------------------------------------------------------
  kpis():            Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/kpis`)); }
  kpi(kpiId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/api/v1/kpis/${kpiId}`).pipe(map((r) => r.data));
  }
  createKpi(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/kpis`, body).pipe(map((r) => r.data));
  }
  updateKpi(kpiId: number, body: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.base}/api/v1/kpis/${kpiId}`, body).pipe(map((r) => r.data));
  }

  // -- reports ------------------------------------------------------------
  reports():         Observable<any[]> { return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/reports`)); }
  report(reportId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/api/v1/reports/${reportId}`).pipe(map((r) => r.data));
  }
  reportsByType(type: string): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/reports/by-type?type=${encodeURIComponent(type)}`));
  }
  generateReport(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/reports`, body).pipe(map((r) => r.data));
  }

  // ════════════════════════════════════════════════════════════════════
  // task-service
  // ════════════════════════════════════════════════════════════════════
  tasks(userId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/tasks/user/${userId}`));
  }
  pendingTasks(userId: number): Observable<any[]> {
    return unwrap(this.http.get<ApiResponse<any[]>>(`${this.base}/api/v1/tasks/user/${userId}/pending`));
  }
  createTask(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/api/v1/tasks`, body).pipe(map((r) => r.data));
  }
  updateTaskStatus(taskId: number, status: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/api/v1/tasks/${taskId}/status?status=${status}`, {}).pipe(map((r) => r.data));
  }

  // -- audit logs (ADMIN only — gated by backend) -------------------------
  auditLogs(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/audit-logs`); }
  auditLogsByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/audit-logs/by-user?userId=${userId}`);
  }
  auditLogsByResource(resourceType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/audit-logs/by-resource?resourceType=${encodeURIComponent(resourceType)}`);
  }
  auditLogsByAction(action: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/audit-logs/by-action?action=${encodeURIComponent(action)}`);
  }
}

function unwrap<T>(obs: Observable<ApiResponse<T[]>>): Observable<T[]> {
  return obs.pipe(map((r) => r?.data ?? []));
}

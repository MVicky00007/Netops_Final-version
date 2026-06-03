import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule,
  ],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css',
})
export class AuditLogComponent implements OnInit {
  private api = inject(ApiService);

  rows = signal<any[]>([]);
  users = signal<any[]>([]);
  loading = signal(true);
  filter: { kind: 'all' | 'user' | 'resource' | 'action'; value: any } = { kind: 'all', value: null };

  ngOnInit() {
    this.api.users().subscribe((u) => this.users.set(u));
    this.loadAll();
  }

  reset() { this.filter.value = null; if (this.filter.kind === 'all') this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.api.auditLogs().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  apply() {
    if (!this.filter.value) return;
    this.loading.set(true);
    const obs =
      this.filter.kind === 'user'     ? this.api.auditLogsByUser(this.filter.value) :
      this.filter.kind === 'resource' ? this.api.auditLogsByResource(this.filter.value) :
      this.filter.kind === 'action'   ? this.api.auditLogsByAction(this.filter.value) :
                                        this.api.auditLogs();
    obs.subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

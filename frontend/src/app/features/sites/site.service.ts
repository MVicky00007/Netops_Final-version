import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Site, SiteRequest } from '../../core/models/site.model';

@Injectable({ providedIn: 'root' })
export class SiteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/sites`;

  list(): Observable<Site[]> {
    return this.http.get<Site[]>(this.base);
  }

  get(id: number): Observable<Site> {
    return this.http.get<Site>(`${this.base}/${id}`);
  }

  create(body: SiteRequest): Observable<Site> {
    return this.http.post<Site>(this.base, body);
  }

  update(id: number, body: Partial<SiteRequest>): Observable<Site> {
    return this.http.put<Site>(`${this.base}/${id}`, body);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Formation {
  id: string;
  title: string;
  description: string;
  location: string;
  formateur: string;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  certificateId: string;
  status: 'PLANIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  participants: string[];
  cost: number;
  category: string;
  skills: string;
  currentParticipants: number;
}

export interface FormationRequest {
  title: string;
  description: string;
  location: string;
  formateur: string;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  cost: number;
  category: string;
  skills: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormationService {
  private apiUrl = `${environment.apiUrl}/api/formations`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return token
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  getAllFormations(): Observable<Formation[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<Formation[]>(this.apiUrl, { headers }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getFormationById(id: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.get<Formation>(`${this.apiUrl}/${id}`, { headers });
  }

  createFormation(request: FormationRequest, createdById: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('createdById', createdById);

    return this.http.post<Formation>(this.apiUrl, request, { headers, params }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateFormation(id: string, request: FormationRequest): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.put<Formation>(`${this.apiUrl}/${id}`, request, { headers });
  }

  deleteFormation(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  startFormation(id: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.post<Formation>(`${this.apiUrl}/${id}/start`, {}, { headers });
  }

  completeFormation(id: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.post<Formation>(`${this.apiUrl}/${id}/complete`, {}, { headers });
  }

  cancelFormation(id: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.post<Formation>(`${this.apiUrl}/${id}/cancel`, {}, { headers });
  }

  addParticipant(formationId: string, employeeId: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.post<Formation>(`${this.apiUrl}/${formationId}/participants/${employeeId}`, {}, { headers });
  }

  removeParticipant(formationId: string, employeeId: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.delete<Formation>(`${this.apiUrl}/${formationId}/participants/${employeeId}`, { headers });
  }

  getFormationsByParticipant(employeeId: string): Observable<Formation[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Formation[]>(`${this.apiUrl}/participant/${employeeId}`, { headers });
  }

  getFormationsByStatus(status: string): Observable<Formation[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Formation[]>(`${this.apiUrl}/status/${status}`, { headers });
  }

  getFormationsByCategory(category: string): Observable<Formation[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Formation[]>(`${this.apiUrl}/category/${category}`, { headers });
  }

  searchFormations(keyword: string): Observable<Formation[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<Formation[]>(`${this.apiUrl}/search`, { params, headers });
  }

  getUpcomingFormations(): Observable<Formation[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Formation[]>(`${this.apiUrl}/upcoming`, { headers });
  }

  getFormationCount(): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<number>(`${this.apiUrl}/stats/count`, { headers });
  }
}

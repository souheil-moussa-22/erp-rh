import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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
  private apiUrl = 'http://localhost:8081/api/formations';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    console.log(' FormationService - Token:', token ? `PRESENT (${token.length} chars)` : 'NULL');

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }

    console.warn(' FormationService - No token found');
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getAllFormations(): Observable<Formation[]> {
    console.log(' FormationService - Getting all formations');
    const headers = this.getAuthHeaders();

    console.log(' Headers:', headers.keys());
    console.log(' Auth header present:', !!headers.get('Authorization'));

    return this.http.get<Formation[]>(this.apiUrl, { headers }).pipe(
      tap(formations => {
        console.log(' Formations loaded successfully:', formations.length);
      }),
      catchError(error => {
        console.error(' Error loading formations:', error);

        // Debug détaillé
        if (error.status === 401) {
          console.error(' 401 Unauthorized!');
          console.error('   - Token used:', headers.get('Authorization')?.substring(0, 30) + '...');
        }

        return throwError(() => error);
      })
    );
  }

  getFormationById(id: string): Observable<Formation> {
    const headers = this.getAuthHeaders();
    return this.http.get<Formation>(`${this.apiUrl}/${id}`, { headers });
  }

  createFormation(request: FormationRequest, createdById: string): Observable<Formation> {
    console.log(' Creating formation...');
    console.log(' Request:', request);
    console.log(' Created by ID:', createdById);

    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('createdById', createdById);

    console.log(' Headers for POST:', headers.keys());
    console.log(' Auth header:', headers.get('Authorization')?.substring(0, 30) + '...');
    console.log(' Params:', params.toString());

    return this.http.post<Formation>(this.apiUrl, request, { headers, params }).pipe(
      tap(response => {
        console.log(' Formation created successfully:', response.id);
      }),
      catchError(error => {
        console.error(' Error creating formation:', error);

        if (error.status === 401) {
          console.error(' 401 Unauthorized for POST!');
          console.error('   - Token used:', headers.get('Authorization')?.substring(0, 30) + '...');
        }

        return throwError(() => error);
      })
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

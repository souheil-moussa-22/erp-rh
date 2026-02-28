import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CongeRequest {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Conge {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: string;
  submissionDate: string;

  // RH Response fields
  rhResponseDate?: string;
  rhRespondedBy?: string;
  rhRejectionReason?: string;

  // Manager Response fields
  managerResponseDate?: string;
  managerRespondedBy?: string;
  managerRejectionReason?: string;
}

export interface CongeStatusUpdate {
  status: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CongeService {
  private apiUrl = 'http://localhost:8081/api/conges';

  constructor(private http: HttpClient) {}

  submitCongeRequest(employeeId: string, request: CongeRequest): Observable<Conge> {
    return this.http.post<Conge>(`${this.apiUrl}/submit?employeeId=${employeeId}`, request);
  }

  getEmployeeConges(employeeId: string): Observable<Conge[]> {
    return this.http.get<Conge[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  getAllPendingConges(): Observable<Conge[]> {
    return this.http.get<Conge[]>(`${this.apiUrl}/pending`);
  }

  getManagerPendingConges(): Observable<Conge[]> {
    return this.http.get<Conge[]>(`${this.apiUrl}/pending-manager`);
  }

  getAllConges(): Observable<Conge[]> {
    return this.http.get<Conge[]>(`${this.apiUrl}`);
  }

  getCongeById(congeId: string): Observable<Conge> {
    return this.http.get<Conge>(`${this.apiUrl}/${congeId}`);
  }

  updateCongeStatus(congeId: string, managerId: string, statusUpdate: CongeStatusUpdate): Observable<Conge> {
    return this.http.put<Conge>(
      `${this.apiUrl}/${congeId}/status?managerId=${managerId}`,
      statusUpdate
    );
  }

  deleteConge(congeId: string, employeeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${congeId}?employeeId=${employeeId}`);
  }

  getCongesByStatus(status: string): Observable<Conge[]> {
    return this.http.get<Conge[]>(`${this.apiUrl}/status/${status}`);
  }
}

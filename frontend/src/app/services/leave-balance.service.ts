import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Exportez l'interface AVANT la classe
export interface LeaveBalanceDTO {
  leaveType: string;
  leaveLabel: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

@Injectable({
  providedIn: 'root'
})

export class LeaveBalanceService {
  private apiUrl = `${environment.apiUrl}/api/leave-balances`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return token
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  getEmployeeLeaveBalances(employeeId: string): Observable<LeaveBalanceDTO[]> {
    return this.http.get<LeaveBalanceDTO[]>(
      `${this.apiUrl}/employee/${employeeId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getEmployeeLeaveBalanceByType(employeeId: string, leaveType: string): Observable<LeaveBalanceDTO> {
    return this.http.get<LeaveBalanceDTO>(
      `${this.apiUrl}/employee/${employeeId}/type/${leaveType}`,
      { headers: this.getAuthHeaders() }
    );
  }

  calculateUsedLeaveDays(employeeId: string, leaveType: string): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/employee/${employeeId}/calculate-used-days?leaveType=${leaveType}`,
      { headers: this.getAuthHeaders() }
    );
  }

  calculateRemainingLeaveDays(employeeId: string, leaveType: string): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/employee/${employeeId}/calculate-remaining-days?leaveType=${leaveType}`,
      { headers: this.getAuthHeaders() }
    );
  }
}

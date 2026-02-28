import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:8081/api/leave-balances';

  constructor(private http: HttpClient) { }

  getEmployeeLeaveBalances(employeeId: string): Observable<LeaveBalanceDTO[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<LeaveBalanceDTO[]>(
      `${this.apiUrl}/employee/${employeeId}`,
      { headers }
    );
  }

  getEmployeeLeaveBalanceByType(employeeId: string, leaveType: string): Observable<LeaveBalanceDTO> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<LeaveBalanceDTO>(
      `${this.apiUrl}/employee/${employeeId}/type/${leaveType}`,
      { headers }
    );
  }

  calculateUsedLeaveDays(employeeId: string, leaveType: string): Observable<number> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<number>(
      `${this.apiUrl}/employee/${employeeId}/calculate-used-days?leaveType=${leaveType}`,
      { headers }
    );
  }

  calculateRemainingLeaveDays(employeeId: string, leaveType: string): Observable<number> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<number>(
      `${this.apiUrl}/employee/${employeeId}/calculate-remaining-days?leaveType=${leaveType}`,
      { headers }
    );
  }
}

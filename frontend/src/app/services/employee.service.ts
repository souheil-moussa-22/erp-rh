import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, throwError } from 'rxjs';
import { saveAs } from 'file-saver';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Formation {
  id?: string;
  name: string;
  location?: string;
  startDate: string;
  endDate: string;
  certificateId?: string;
}

export interface Employee {
  id?: string;
  employee?: Employee;
  username: string;
  email: string;
  phone?: string;
  salary?: number;
  status?: string;
  hireDate?: string;
  photoUrl?: string;
  photoId?: string;
  department?: string;
  age?: number;
  performance?: string;
  satisfaction?: number;
  // Informations fiche de paie tunisienne
  cin?: string;
  cnssNumber?: string;
  position?: string;
  address?: string;
  city?: string;
  matricule?: string;
  rib?: string;
  bankName?: string;
  workingDays?: number;
  actualWorkingDays?: number;
  transportAllowance?: number;
  familyAllowance?: number;
  otherBonuses?: number;

  // Ancienneté et primes
  seniorityBonus?: number;
  yearsOfService?: number;
  monthsOfService?: number;
  bonusPeriods?: number;
  traditionalSeniorityBonus?: number;
  nineDinarsBonus?: number;
  seniorityBlocks?: number;

  // Rôles et formations
  roleNames?: string[];
  formations?: Formation[];
}

export interface Payslip {
  id: string;
  fileName: string;
  generationDate: string;
  period: string;
  month: number;
  year: number;
  netSalary: number;
  grossSalary: number;
  seniorityBonus?: number;
  yearsOfService?: number;
  monthsOfService?: number;
  bonusPeriods?: number;
}
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeServices {
  private apiUrl = `${environment.apiUrl}/api/employees`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Méthode utilitaire pour créer les headers avec le token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Méthode pour les requêtes avec FormData (pas de Content-Type, laissé au navigateur)
  private getAuthHeadersFormData(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }

  // Headers pour les requêtes blob
  private getAuthHeadersBlob(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }

  // ================= EMPLOYEE =================
  getAllEmployees(): Observable<Employee[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<Employee[]>(this.apiUrl, {
      headers,
      observe: 'response'
    }).pipe(
      map(response => response.body || []),
      catchError(error => throwError(() => error))
    );
  }

  getEmployeeById(id: string): Observable<Employee> {
    const headers = this.getAuthHeaders();

    return this.http.get<Employee>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }




  // ================= GÉNÉRATION FICHES DE PAIE EN MASSE =================
  generatePayslipsForYear(employeeId: string, year: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/${employeeId}/payslips/generate-year?year=${year}`,
      {},
      { headers }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  generateTestPayslips(employeeId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/${employeeId}/payslips/generate-test`,
      {},
      { headers }
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  createEmployee(employee: Employee): Observable<Employee> {
    const headers = this.getAuthHeaders();

    return this.http.post<Employee>(`${this.apiUrl}/Add-employee`, employee, { headers }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateEmployeeById(id: string, data: Employee): Observable<Employee> {
    const headers = this.getAuthHeaders();

    return this.http.put<Employee>(`${this.apiUrl}/${id}`, data, { headers }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteEmployee(id: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text',
      headers
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ================= PHOTO =================
getEmployeePhotoBlob(id: string): Observable<Blob> {
    const headers = this.getAuthHeadersBlob();
    const timestamp = new Date().getTime();

    return this.http.get(`${this.apiUrl}/${id}/photo`, {
      responseType: 'blob',
      headers: headers,
      params: new HttpParams().set('t', timestamp.toString())
    }).pipe(
      catchError(error => {
        return this.getDefaultProfileImage();
      })
    );
  }

  getEmployeePhoto(id: string): string {
    const timestamp = new Date().getTime();
    return `${this.apiUrl}/${id}/photo?t=${timestamp}`;
  }

  private getDefaultProfileImage(): Observable<Blob> {
    const svgString = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <circle cx="100" cy="80" r="40" fill="#cccccc"/>
        <circle cx="100" cy="60" r="30" fill="#cccccc"/>
        <text x="100" y="140" font-size="14" text-anchor="middle" fill="#666666">No Image</text>
    </svg>`;

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    return of(blob);
  }

  getEmployeePhotoUrl(id: string): Observable<string> {
    return this.getEmployeePhotoBlob(id).pipe(
      map(blob => {
        if (blob && blob.size > 0) {
          return URL.createObjectURL(blob);
        } else {
          return '/assets/default-profile.png';
        }
      }),
      catchError(error => {
        return of('/assets/default-profile.png');
      })
    );
  }

  uploadPhoto(id: string, formData: FormData): Observable<Employee> {
    const headers = this.getAuthHeadersFormData();
    return this.http.post<Employee>(`${this.apiUrl}/${id}/upload-photo`, formData, { headers }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }


  // ================= FORMATION =================
  addFormation(employeeId: string, formData: FormData): Observable<Formation> {
    const headers = this.getAuthHeadersFormData();

    return this.http.post<Formation>(`${this.apiUrl}/${employeeId}/formations`, formData, { headers }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getFormationCertificate(certificateId: string): string {
    return `${this.apiUrl}/formations/certificate/${certificateId}`;
  }

  deleteFormation(employeeId: string, formationId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${employeeId}/formations/${formationId}`, {
      responseType: 'text',
      headers
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getFormationCertificateBlob(certificateId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/formations/certificate/${certificateId}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf',
        ...headers.keys().reduce((acc, key) => {
          acc[key] = headers.get(key);
          return acc;
        }, {} as any)
      }
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ================= PAYSLIP =================
  getPayslipPDF(employeeId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/${employeeId}/payslip`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf',
        ...headers.keys().reduce((acc, key) => {
          acc[key] = headers.get(key);
          return acc;
        }, {} as any)
      }
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ================= HISTORIQUE FICHES DE PAIE =================
  getEmployeePayslipsByYear(employeeId: string, year: number): Observable<Payslip[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('year', year.toString());

    return this.http.get<Payslip[]>(`${this.apiUrl}/${employeeId}/payslips/by-year`, { headers, params }).pipe(
      catchError(() =>
        this.getEmployeePayslips(employeeId).pipe(
          map(allPayslips => allPayslips.filter(p => p.year === year))
        )
      )
    );
  }

  getEmployeePayslips(employeeId: string): Observable<Payslip[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<Payslip[]>(`${this.apiUrl}/${employeeId}/payslips`, { headers }).pipe(
      catchError(() => of([]))
    );
  }

  downloadHistoricalPayslip(payslipId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/payslips/${payslipId}/download`, {
      responseType: 'blob',
      headers
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ================= GÉNÉRATION FICHE DE PAIE =================
  generatePayslipForMonth(employeeId: string, month: number, year: number): Observable<Payslip> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.post<Payslip>(`${this.apiUrl}/${employeeId}/payslip/generate`, null, { headers, params }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getAvailableYears(employeeId: string): Observable<number[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<number[]>(`${this.apiUrl}/${employeeId}/payslips/years`, { headers }).pipe(
      catchError(() => {
        const currentYear = new Date().getFullYear();
        return of([currentYear, currentYear - 1, currentYear - 2]);
      })
    );
  }

  // ================= EXPORT / IMPORT EXCEL =================
  exportEmployees(): Observable<Blob> {
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
      headers
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  downloadEmployeesExcel(): void {
    this.exportEmployees().subscribe({
      next: (res: Blob) => saveAs(res, 'employees.xlsx'),
      error: () => {}
    });
  }

  importEmployees(file: File): Observable<any> {
    const headers = this.getAuthHeadersFormData();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/import`, formData, { headers }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // ================= UTILITY METHODS =================
  testConnection(): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/test`, { headers }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  checkAuthStatus(): void {
    // no-op utility method kept for backward compatibility
  }

  testPhotoRequest(id: string): void {
    this.getEmployeePhotoBlob(id).subscribe({ error: () => {} });
  }

  // ================= CHANGEMENT MOT DE PASSE =================
  changePassword(employeeId: string, passwordData: PasswordChangeData): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.put(`${this.apiUrl}/${employeeId}/change-password`, passwordData, {
      headers,
      responseType: 'text'
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, throwError } from 'rxjs';
import { saveAs } from 'file-saver';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

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
  private apiUrl = 'http://localhost:8081/api/employees';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Méthode utilitaire pour créer les headers avec le token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log(' Creating auth headers with token:', token ? 'PRESENT' : 'NULL');

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    } else {
      console.warn(' No token found for authenticated request');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
  }

  // Méthode pour les requêtes avec FormData
  private getAuthHeadersFormData(): HttpHeaders {
    const token = this.authService.getToken();
    console.log(' Creating FormData auth headers with token:', token ? 'PRESENT' : 'NULL');

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    } else {
      console.warn(' No token found for FormData request');
      return new HttpHeaders();
    }
  }

  // Headers pour les requêtes blob - VERSION CORRIGÉE
  private getAuthHeadersBlob(): HttpHeaders {
    const token = this.authService.getToken();
    console.log(' Creating blob auth headers with token:', token ? 'PRESENT' : 'NULL');

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    } else {
      console.warn(' No token found for blob request');
      return new HttpHeaders();
    }
  }

  // ================= EMPLOYEE =================
// employee.service.ts
  getAllEmployees(): Observable<Employee[]> {
    console.log(' getAllEmployees - Starting request with DTO format');
    const headers = this.getAuthHeaders();

    return this.http.get<Employee[]>(this.apiUrl, {
      headers,
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('getAllEmployees SUCCESS - Status:', response.status);
        console.log(' Employees count:', response.body?.length || 0);
      }),
      map(response => response.body || []),
      catchError(error => {
        console.error(' getAllEmployees FAILED:', error);

        // Log détaillé de l'erreur
        if (error.status === 200) {
          console.error(' Raw error response:', error.error);
        }

        return throwError(() => error);
      })
    );
  }
getEmployeeById(id: string): Observable<Employee> {
    console.log(' getEmployeeById - ID:', id);

    const token = this.authService.getToken();
    if (!token) {
        console.error(' No token available');
        return throwError(() => new Error('No authentication token'));
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    return this.http.get<Employee>(`${this.apiUrl}/${id}`, { headers }).pipe(
        tap((employee) => {
            console.log(' getEmployeeById SUCCESS - Employee:', employee?.username);
        }),
        catchError(error => {
            console.error(' getEmployeeById FAILED - Status:', error.status);

            if (error.status === 401 || error.status === 403) {
                console.error(' Authentication error, redirecting to login');
                this.authService.logout();
            }

            return throwError(() => error);
        })
    );
}




  // ================= GÉNÉRATION FICHES DE PAIE EN MASSE =================
  generatePayslipsForYear(employeeId: string, year: number): Observable<any> {
    console.log(' generatePayslipsForYear - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/${employeeId}/payslips/generate-year?year=${year}`,
      {},
      { headers }
    ).pipe(
      tap(result => {
        console.log(' generatePayslipsForYear SUCCESS:', result);
      }),
      catchError(error => {
        console.error(' generatePayslipsForYear FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  generateTestPayslips(employeeId: string): Observable<any> {
    console.log(' generateTestPayslips - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/${employeeId}/payslips/generate-test`,
      {},
      { headers }
    ).pipe(
      tap(result => {
        console.log(' generateTestPayslips SUCCESS:', result);
      }),
      catchError(error => {
        console.error(' generateTestPayslips FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  createEmployee(employee: Employee): Observable<Employee> {
    console.log(' createEmployee - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.post<Employee>(`${this.apiUrl}/Add-employee`, employee, { headers }).pipe(
      tap((newEmployee) => console.log(' createEmployee SUCCESS - New ID:', newEmployee?.id)),
      catchError(error => {
        console.error(' createEmployee FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  updateEmployeeById(id: string, data: Employee): Observable<Employee> {
    console.log(' updateEmployeeById - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.put<Employee>(`${this.apiUrl}/${id}`, data, { headers }).pipe(
      tap((updatedEmployee) => console.log(' updateEmployeeById SUCCESS - Updated:', updatedEmployee?.username)),
      catchError(error => {
        console.error(' updateEmployeeById FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  deleteEmployee(id: string): Observable<any> {
    console.log(' deleteEmployee - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text',
      headers
    }).pipe(
      tap(() => console.log(' deleteEmployee SUCCESS')),
      catchError(error => {
        console.error('deleteEmployee FAILED:', error);
        return throwError(() => error);
      })
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
    console.log(' addFormation - Adding FormData auth headers');
    const headers = this.getAuthHeadersFormData();

    return this.http.post<Formation>(`${this.apiUrl}/${employeeId}/formations`, formData, { headers }).pipe(
      tap((formation) => console.log(' addFormation SUCCESS - New formation:', formation?.name)),
      catchError(error => {
        console.error(' addFormation FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  getFormationCertificate(certificateId: string): string {
    const certificateUrl = `${this.apiUrl}/formations/certificate/${certificateId}`;
    console.log(' Generated certificate URL:', certificateUrl);
    return certificateUrl;
  }

  deleteFormation(employeeId: string, formationId: string): Observable<any> {
    console.log(' deleteFormation - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${employeeId}/formations/${formationId}`, {
      responseType: 'text',
      headers
    }).pipe(
      tap(() => console.log(' deleteFormation SUCCESS')),
      catchError(error => {
        console.error(' deleteFormation FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  getFormationCertificateBlob(certificateId: string): Observable<Blob> {
    console.log(' getFormationCertificateBlob - Adding auth headers');
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
      tap(() => console.log(' getFormationCertificateBlob SUCCESS')),
      catchError(error => {
        console.error(' getFormationCertificateBlob FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  // ================= PAYSLIP =================
  getPayslipPDF(employeeId: string): Observable<Blob> {
    console.log(' getPayslipPDF - Adding auth headers');
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
      tap(() => console.log(' getPayslipPDF SUCCESS')),
      catchError(error => {
        console.error(' getPayslipPDF FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  // ================= HISTORIQUE FICHES DE PAIE =================
  getEmployeePayslipsByYear(employeeId: string, year: number): Observable<Payslip[]> {
    console.log(' getEmployeePayslipsByYear - Adding auth headers');
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('year', year.toString());

    return this.http.get<Payslip[]>(`${this.apiUrl}/${employeeId}/payslips/by-year`, { headers, params }).pipe(
      tap(payslips => {
        console.log(` getEmployeePayslipsByYear SUCCESS: ${payslips?.length || 0} payslips`);
      }),
      catchError(error => {
        console.error(` getEmployeePayslipsByYear FAILED:`, error);
        return this.getEmployeePayslips(employeeId).pipe(
          map(allPayslips => {
            const filtered = allPayslips.filter(p => p.year === year);
            console.log(`Fallback - Fiches filtrées pour ${year}:`, filtered.length);
            return filtered;
          })
        );
      })
    );
  }

  getEmployeePayslips(employeeId: string): Observable<Payslip[]> {
    console.log(' getEmployeePayslips - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.get<Payslip[]>(`${this.apiUrl}/${employeeId}/payslips`, { headers }).pipe(
      tap(payslips => {
        console.log(' getEmployeePayslips SUCCESS:', payslips?.length || 0, 'payslips');
      }),
      catchError(error => {
        console.error(' getEmployeePayslips FAILED:', error);
        return of([]);
      })
    );
  }

  downloadHistoricalPayslip(payslipId: string): Observable<Blob> {
    console.log(' downloadHistoricalPayslip - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/payslips/${payslipId}/download`, {
      responseType: 'blob',
      headers
    }).pipe(
      tap(() => console.log(`downloadHistoricalPayslip SUCCESS for ID: ${payslipId}`)),
      catchError(error => {
        console.error(' downloadHistoricalPayslip FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  // ================= GÉNÉRATION FICHE DE PAIE =================
  generatePayslipForMonth(employeeId: string, month: number, year: number): Observable<Payslip> {
    console.log(' generatePayslipForMonth - Adding auth headers');
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.post<Payslip>(`${this.apiUrl}/${employeeId}/payslip/generate`, null, { headers, params }).pipe(
      tap(response => {
        console.log(' generatePayslipForMonth SUCCESS:', response);
      }),
      catchError(error => {
        console.error(' generatePayslipForMonth FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  getAvailableYears(employeeId: string): Observable<number[]> {
    console.log('getAvailableYears - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.get<number[]>(`${this.apiUrl}/${employeeId}/payslips/years`, { headers }).pipe(
      tap(years => console.log(' getAvailableYears SUCCESS:', years)),
      catchError(error => {
        console.error(' getAvailableYears FAILED:', error);
        const currentYear = new Date().getFullYear();
        return of([currentYear, currentYear - 1, currentYear - 2]);
      })
    );
  }

  // ================= EXPORT / IMPORT EXCEL =================
  exportEmployees(): Observable<Blob> {
    console.log(' exportEmployees - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
      headers
    }).pipe(
      tap(() => console.log('exportEmployees SUCCESS')),
      catchError(error => {
        console.error(' exportEmployees FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  downloadEmployeesExcel(): void {
    this.exportEmployees().subscribe({
      next: (res: Blob) => {
        saveAs(res, 'employees.xlsx');
        console.log(' downloadEmployeesExcel SUCCESS');
      },
      error: (err: any) => {
        console.error(" downloadEmployeesExcel FAILED:", err);
      }
    });
  }

  importEmployees(file: File): Observable<any> {
    console.log(' importEmployees - Adding FormData auth headers');
    const headers = this.getAuthHeadersFormData();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/import`, formData, { headers }).pipe(
      tap(() => console.log(' importEmployees SUCCESS')),
      catchError(error => {
        console.error(' importEmployees FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  // ================= UTILITY METHODS =================
  testConnection(): Observable<any> {
    console.log(' Testing API connection...');
    const headers = this.getAuthHeaders();

    return this.http.get(`${this.apiUrl}/test`, { headers }).pipe(
      tap(() => console.log(' Connection test SUCCESS')),
      catchError(error => {
        console.error(' Connection test FAILED:', error);
        return throwError(() => error);
      })
    );
  }

  checkAuthStatus(): void {
    const token = this.authService.getToken();
    const user = this.authService.getUser();

    console.log(' Auth Status Check:');
    console.log('  - Token:', token ? `PRESENT (${token.length} chars)` : 'NULL');
    console.log('  - User:', user ? 'PRESENT' : 'NULL');

    if (user) {
      console.log('  - User ID:', user.id);
      console.log('  - Username:', user.username);
      console.log('  - Roles:', user.roles);
    }
  }

  //   MÉTHODE POUR TESTER LES HEADERS
  testPhotoRequest(id: string): void {
    const headers = this.getAuthHeadersBlob();
    console.log(' TEST Headers structure:', headers);
    console.log(' TEST Headers keys:', headers.keys());
    console.log('TEST Authorization header:', headers.get('Authorization'));

    this.getEmployeePhotoBlob(id).subscribe({
      next: (blob) => {
        console.log('TEST SUCCESS - Blob received:', blob.size);
      },
      error: (error) => {
        console.error(' TEST FAILED:', error);
      }
    });
  }
// ================= CHANGEMENT MOT DE PASSE =================
  changePassword(employeeId: string, passwordData: PasswordChangeData): Observable<any> {
    console.log(' changePassword - Adding auth headers');
    const headers = this.getAuthHeaders();

    return this.http.put(`${this.apiUrl}/${employeeId}/change-password`, passwordData, {
      headers,
      responseType: 'text'
    }).pipe(
      tap(() => console.log(' changePassword SUCCESS')),
      catchError(error => {
        console.error(' changePassword FAILED:', error);
        return throwError(() => error);
      })
    );
  }}

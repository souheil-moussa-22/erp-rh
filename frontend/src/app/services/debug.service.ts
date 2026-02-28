import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  testAuth(): Observable<any> {
    console.log(' Testing authentication...');

    const token = localStorage.getItem('authToken');
    console.log(' Token in localStorage:', token ? `PRESENT (${token.length} chars)` : 'NULL');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log(' JWT Payload:', payload);
        console.log(' Email:', payload.email);
        console.log(' Roles:', payload.roles);
      } catch (e) {
        console.error(' Error decoding token:', e);
      }
    }

    return this.http.get(`${this.apiUrl}/test/authenticated`).pipe(
      tap((response: any) => {
        console.log(' Auth test response:', response);
      }),
      catchError(error => {
        console.error(' Auth test failed:', error);
        return throwError(() => error);
      })
    );
  }

  testFormationsAccess(): Observable<any> {
    console.log(' Testing formations access...');

    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log(' Adding Authorization header to formations test');
    } else {
      console.warn(' No token found for formations test');
    }

    return this.http.get(`${this.apiUrl}/formations`, { headers }).pipe(
      tap((response: any) => {
        console.log(' Formations access granted:', response);
      }),
      catchError(error => {
        console.error(' Formations access denied:', error);

        if (error.status === 401) {
          console.error(' 401 Unauthorized - Possible issues:');
          console.error('   1. Token missing or expired');
          console.error('   2. Wrong role in token');
          console.error('   3. Backend security configuration');
        } else if (error.status === 403) {
          console.error(' 403 Forbidden - Insufficient permissions');
        }

        return throwError(() => error);
      })
    );
  }

  testRoles(): Observable<any> {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get(`${this.apiUrl}/test/hr`, { headers }).pipe(
      tap((response: any) => {
        console.log(' HR endpoint accessible:', response);
      }),
      catchError(error => {
        console.error(' HR endpoint not accessible:', error);
        return throwError(() => error);
      })
    );
  }

  //  méthode pour tester les rôles spécifiques
  testSpecificRoles(): Observable<any> {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Tester plusieurs endpoints pour différents rôles
    return this.http.get(`${this.apiUrl}/test/employee`, { headers }).pipe(
      tap((response: any) => {
        console.log(' Employee endpoint accessible:', response);
      }),
      catchError(error => {
        console.log(' Employee endpoint not accessible (expected for HR):', error.status);

        // Tester maintenant le endpoint HR
        return this.http.get(`${this.apiUrl}/test/hr`, { headers }).pipe(
          tap((hrResponse: any) => {
            console.log(' HR endpoint accessible:', hrResponse);
          }),
          catchError(hrError => {
            console.error(' HR endpoint also not accessible:', hrError.status);
            return throwError(() => hrError);
          })
        );
      })
    );
  }

  // Méthode pour tester avec des headers différents
  testWithManualHeaders(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.error(' No token found for manual test');
      return;
    }

    console.log(' Manual test with full headers object');

    // Créer les headers correctement
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log(' Headers to send:', headers.keys());

    this.http.get(`${this.apiUrl}/formations`, { headers }).subscribe({
      next: (response: any) => {
        console.log(' Manual test SUCCESS:', response);
      },
      error: (error: any) => {
        console.error(' Manual test FAILED:', error);
        console.log(' Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message
        });
      }
    });
  }

  // Méthode pour debugger le token en détail
  debugToken(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn(' No token found in localStorage');
      return;
    }

    console.log(' Token Debug:');
    console.log('  - Présent:', !!token);
    console.log('  - Longueur:', token.length);
    console.log('  - Format:', token.split('.').length === 3 ? 'JWT' : 'Unknown');

    try {
      // Décoder le token JWT
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));

        console.log('  - Header:', header);
        console.log('  - Payload:', payload);
        console.log('  - Expiration:', new Date(payload.exp * 1000));
        console.log('  - Subject:', payload.sub);
        console.log('  - Email:', payload.email);
        console.log('  - Roles:', payload.roles);

        // Vérifier si les rôles sont corrects
        if (payload.roles) {
          const hasHRRole = payload.roles.includes('ROLE_RH') || payload.roles.includes('ROLE_HR');
          const hasHRManagerRole = payload.roles.includes('ROLE_HRMANAGER');

          console.log('  - Has HR role:', hasHRRole);
          console.log('  - Has HR Manager role:', hasHRManagerRole);
          console.log('  - Should access formations:', hasHRRole || hasHRManagerRole);
        }
      }
    } catch (error) {
      console.error('  - Error decoding token:', error);
    }
  }

  // Méthode pour tester sans token (public endpoint)
  testPublicEndpoint(): Observable<any> {
    console.log(' Testing public endpoint (no auth required)');

    return this.http.get(`${this.apiUrl}/test/public`).pipe(
      tap((response: any) => {
        console.log(' Public endpoint accessible:', response);
      }),
      catchError(error => {
        console.error(' Public endpoint not accessible:', error);
        return throwError(() => error);
      })
    );
  }

  // Méthode pour vérifier la santé du backend
  testBackendHealth(): Observable<any> {
    console.log(' Testing backend health...');

    return this.http.get(`${this.apiUrl}/test/health`).pipe(
      tap((response: any) => {
        console.log(' Backend is healthy:', response);
      }),
      catchError(error => {
        console.error(' Backend health check failed:', error);
        return throwError(() => error);
      })
    );
  }
}

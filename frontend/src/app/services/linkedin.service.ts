import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface LinkedInPublishResponse {
  id: string;
  success: boolean;
  message: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LinkedInService {
  private apiUrl = 'http://localhost:8081/api/linkedin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Publier une offre sur LinkedIn
  publishJobToLinkedIn(jobOfferId: string): Observable<LinkedInPublishResponse> {
    const headers = this.getHeaders();
    return this.http.post<LinkedInPublishResponse>(
      `${this.apiUrl}/job-offers/${jobOfferId}/publish`,
      {},
      { headers }
    );
  }

  // Vérifier le statut de l'intégration
  checkIntegrationStatus(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/integration/status`, { headers });
  }

  // Initier l'authentification LinkedIn
  initiateAuth(organizationId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(
      `${this.apiUrl}/auth/init?organizationId=${organizationId}`,
      { headers }
    );
  }
}
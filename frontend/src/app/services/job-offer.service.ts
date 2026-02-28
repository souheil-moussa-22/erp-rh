import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  contractType: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  status: string;
  publishedBy: string;
  publishedDate: string;
  closingDate: string;
  createdAt: string;
  updatedAt: string;
  linkedInPostId: string;
  externalPlatforms: string[];
  applicationCount: number;
  viewCount: number;
  tags: string[];
  experienceLevel: string;
  educationRequired: string;
  isActive: boolean;
}

export interface JobOfferRequest {
  title: string;
  description: string;
  department: string;
  location: string;
  contractType: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  closingDate: string;
  tags: string[];
  experienceLevel: string;
  educationRequired: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JobOfferService {
  private apiUrl = 'http://localhost:8081/api/job-offers';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    } else {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
  }

  getAllJobOffers(): Observable<JobOffer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<JobOffer[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }



  createJobOffer(request: JobOfferRequest, publisherId: string): Observable<JobOffer> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('publisherId', publisherId);
    return this.http.post<JobOffer>(this.apiUrl, request, { headers, params })
      .pipe(catchError(this.handleError));
  }


  deleteJobOffer(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  publishJobOffer(id: string): Observable<JobOffer> {
    const headers = this.getAuthHeaders();
    return this.http.post<JobOffer>(`${this.apiUrl}/${id}/publish`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  closeJobOffer(id: string): Observable<JobOffer> {
    const headers = this.getAuthHeaders();
    return this.http.post<JobOffer>(`${this.apiUrl}/${id}/close`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  searchJobOffers(keyword: string): Observable<JobOffer[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<JobOffer[]>(`${this.apiUrl}/search`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  getJobOffersByStatus(status: string): Observable<JobOffer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<JobOffer[]>(`${this.apiUrl}/status/${status}`, { headers })
      .pipe(catchError(this.handleError));
  }

  getActiveJobOffers(): Observable<JobOffer[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<JobOffer[]>(`${this.apiUrl}/active`, { headers })
      .pipe(catchError(this.handleError));
  }

  testBackendConnection(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl, { headers })
      .pipe(
        tap(() => console.log(' Backend connection test successful')),
        catchError(this.handleError)
      );
  }
// Dans job-offer.service.ts - AJOUTER CES MÉTHODES

updateJobOffer(id: string, request: JobOfferRequest): Observable<JobOffer> {
  const headers = this.getAuthHeaders();
  return this.http.put<JobOffer>(`${this.apiUrl}/${id}`, request, { headers })
    .pipe(
      tap((updatedJob) => console.log(' Offre mise à jour:', updatedJob.title)),
      catchError(this.handleError)
    );
}

// Méthode pour récupérer une offre spécifique
getJobOfferById(id: string): Observable<JobOffer> {
  const headers = this.getAuthHeaders();
  return this.http.get<JobOffer>(`${this.apiUrl}/${id}`, { headers })
    .pipe(
      tap((job) => console.log(' Offre récupérée:', job.title)),
      catchError(this.handleError)
    );
}
  private handleError(error: HttpErrorResponse) {
    console.error(' JobOfferService Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message
    });

    let errorMessage = 'Une erreur est survenue';

    if (error.status === 401) {
      errorMessage = 'Non autorisé - Le token JWT est manquant ou invalide';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    }

    return throwError(() => new Error(errorMessage));
  }

}

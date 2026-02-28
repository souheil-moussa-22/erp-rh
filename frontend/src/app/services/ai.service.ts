// src/app/services/ai.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface AiSuggestionRequest {
  context?: string;
  input?: string;
  type: AiSuggestionType;
  jobTitle?: string;
  tone?: string;
  language?: string;
  maxLength?: number;
}

export enum AiSuggestionType {
  JOB_DESCRIPTION = 'JOB_DESCRIPTION',
  JOB_TITLE = 'JOB_TITLE',
  REQUIREMENTS = 'REQUIREMENTS',
  RESPONSIBILITIES = 'RESPONSIBILITIES',
  BENEFITS = 'BENEFITS',
  TEXT_IMPROVEMENT = 'TEXT_IMPROVEMENT'
}

export interface AiSuggestionResponse {
  suggestion?: string;
  suggestions?: string[];
  success?: boolean;
  errorMessage?: string;
  tokensUsed?: number;
  model?: string;
}

export interface AiStatusResponse {
  available: boolean;
  modelInfo: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = 'http://localhost:8081/api/ai';
  private jobOfferAiUrl = 'http://localhost:8081/api/job-offers/ai';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
    return headers;
  }

  // Générer une suggestion
  generateSuggestion(request: AiSuggestionRequest): Observable<AiSuggestionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AiSuggestionResponse>(`${this.apiUrl}/suggest`, request, { headers })
      .pipe(catchError(this.handleError));
  }

  // Améliorer un texte
  improveText(text: string, context?: string): Observable<AiSuggestionResponse> {
    const headers = this.getAuthHeaders();
    const params: any = { text };
    if (context) params.context = context;

    return this.http.post<AiSuggestionResponse>(`${this.apiUrl}/improve-text`, null, {
      headers,
      params
    }).pipe(catchError(this.handleError));
  }

  // Générer une description de poste
  generateJobDescription(jobTitle: string, department: string, location: string): Observable<AiSuggestionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AiSuggestionResponse>(
      `${this.jobOfferAiUrl}/generate-description`,
      null,
      {
        headers,
        params: { jobTitle, department, location }
      }
    ).pipe(catchError(this.handleError));
  }

  // AJOUTER CETTE MÉTHODE - Suggérer des titres de poste
  suggestJobTitles(description: string): Observable<string[]> {
    const headers = this.getAuthHeaders();
    const params = { description };

    return this.http.post<string[]>(
      `${this.jobOfferAiUrl}/suggest-titles`,
      null,
      {
        headers,
        params
      }
    ).pipe(catchError(this.handleError));
  }

  // Vérifier le statut
  getStatus(): Observable<AiStatusResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<AiStatusResponse>(`${this.apiUrl}/status`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Vérifier la santé
  getHealth(): Observable<string> {
    return this.http.get(`${this.apiUrl}/health`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('AI Service Error:', error);
    let errorMessage = 'Erreur du service AI';

    if (error.status === 401) {
      errorMessage = 'Veuillez vous connecter';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé - Rôle insuffisant';
    } else if (error.status === 429) {
      errorMessage = 'Trop de requêtes - Veuillez réessayer plus tard';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au service AI';
    } else if (error.error?.errorMessage) {
      errorMessage = error.error.errorMessage;
    }

    return throwError(() => new Error(errorMessage));
  }
}

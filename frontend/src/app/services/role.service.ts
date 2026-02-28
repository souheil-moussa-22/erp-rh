import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Role {
  id: string;
  roleName: string;
}

export interface RoleDTO {
  roleName: string;
}

// Interface pour la réponse de l'API
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/api/roles`;

  constructor(
    private http: HttpClient,
    private authService: AuthService // Injection du service d'authentification
  ) { }

  private handleError(error: HttpErrorResponse) {
    console.error(' API Error:', error);

    let errorMessage = 'Une erreur est survenue';

    if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
    } else if (error.status === 401) {
      errorMessage = 'Accès non autorisé. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
    } else if (error.status === 404) {
      errorMessage = 'API non trouvée. Vérifiez les endpoints du backend.';
    } else if (error.status === 400) {
      // Gérer les erreurs de validation du backend
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = 'Données invalides';
      }
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  // Méthode pour créer les headers avec le token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // READ - Récupérer tous les rôles
  getAllRoles(): Observable<Role[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<Role[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  // CREATE - Créer un nouveau rôle
  createRole(roleName: string): Observable<Role> {
    const headers = this.getAuthHeaders();
    const roleDTO: RoleDTO = { roleName };

    return this.http.post<Role>(this.apiUrl, roleDTO, { headers })
      .pipe(catchError(this.handleError));
  }

  // UPDATE - Mettre à jour un rôle
  updateRole(id: string, roleName: string): Observable<Role> {
    const headers = this.getAuthHeaders();
    const roleDTO: RoleDTO = { roleName };

    return this.http.put<Role>(`${this.apiUrl}/${id}`, roleDTO, { headers })
      .pipe(catchError(this.handleError));
  }

  // DELETE - Supprimer un rôle par ID
  deleteRole(id: string): Observable<string> {
    const headers = this.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text',
      headers
    }).pipe(catchError(this.handleError));
  }

  // GET - Récupérer un rôle par ID
  getRoleById(id: string): Observable<Role> {
    const headers = this.getAuthHeaders();

    return this.http.get<Role>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // GET - Récupérer un rôle par nom
  getRoleByName(roleName: string): Observable<Role> {
    const headers = this.getAuthHeaders();

    return this.http.get<Role>(`${this.apiUrl}/name/${roleName}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // GET - Vérifier si un rôle existe
  roleExists(roleName: string): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.get<boolean>(`${this.apiUrl}/exists/${roleName}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // DELETE - Supprimer tous les rôles
  deleteAllRoles(): Observable<string> {
    const headers = this.getAuthHeaders();

    return this.http.delete(this.apiUrl, {
      responseType: 'text',
      headers
    }).pipe(catchError(this.handleError));
  }
}

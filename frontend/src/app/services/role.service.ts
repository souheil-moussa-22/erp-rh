import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service'; // Import du service d'authentification

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
  private apiUrl = 'http://localhost:8081/api/roles';

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

    console.log(' Creating auth headers with token:', token ? 'PRESENT' : 'NULL');
    if (token) {
      console.log(' Token length:', token.length);
      console.log(' Token start:', token.substring(0, 20) + '...');
    }

    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // READ - Récupérer tous les rôles
  getAllRoles(): Observable<Role[]> {
    console.log(' FETCHING ROLES FROM API');

    const headers = this.getAuthHeaders();
    console.log('Headers to send:', headers);

    return this.http.get<Role[]>(this.apiUrl, { headers })
      .pipe(
        tap(roles => {
          console.log(' ROLES API SUCCESS - Count:', roles?.length || 0);
          console.log('Roles received:', roles);
        }),
        catchError(this.handleError)
      );
  }

  // CREATE - Créer un nouveau rôle
  createRole(roleName: string): Observable<Role> {
    console.log(' CREATING ROLE:', roleName);

    const headers = this.getAuthHeaders();
    const roleDTO: RoleDTO = { roleName };

    return this.http.post<Role>(this.apiUrl, roleDTO, { headers })
      .pipe(
        tap(role => {
          console.log(' ROLE CREATED SUCCESS:', role);
        }),
        catchError(this.handleError)
      );
  }

  // UPDATE - Mettre à jour un rôle
  updateRole(id: string, roleName: string): Observable<Role> {
    console.log(' UPDATING ROLE:', id, roleName);

    const headers = this.getAuthHeaders();
    const roleDTO: RoleDTO = { roleName };

    return this.http.put<Role>(`${this.apiUrl}/${id}`, roleDTO, { headers })
      .pipe(
        tap(role => {
          console.log(' ROLE UPDATED SUCCESS:', role);
        }),
        catchError(this.handleError)
      );
  }

  // DELETE - Supprimer un rôle par ID
  deleteRole(id: string): Observable<string> {
    console.log(' DELETING ROLE:', id);

    const headers = this.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text',
      headers
    }).pipe(
      tap(response => {
        console.log(' ROLE DELETED SUCCESS:', response);
      }),
      catchError(this.handleError)
    );
  }

  // GET - Récupérer un rôle par ID
  getRoleById(id: string): Observable<Role> {
    console.log(' GETTING ROLE BY ID:', id);

    const headers = this.getAuthHeaders();

    return this.http.get<Role>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        tap(role => {
          console.log(' ROLE BY ID SUCCESS:', role);
        }),
        catchError(this.handleError)
      );
  }

  // GET - Récupérer un rôle par nom
  getRoleByName(roleName: string): Observable<Role> {
    console.log(' GETTING ROLE BY NAME:', roleName);

    const headers = this.getAuthHeaders();

    return this.http.get<Role>(`${this.apiUrl}/name/${roleName}`, { headers })
      .pipe(
        tap(role => {
          console.log(' ROLE BY NAME SUCCESS:', role);
        }),
        catchError(this.handleError)
      );
  }

  // GET - Vérifier si un rôle existe
  roleExists(roleName: string): Observable<boolean> {
    console.log(' CHECKING IF ROLE EXISTS:', roleName);

    const headers = this.getAuthHeaders();

    return this.http.get<boolean>(`${this.apiUrl}/exists/${roleName}`, { headers })
      .pipe(
        tap(exists => {
          console.log(' ROLE EXISTS CHECK SUCCESS:', exists);
        }),
        catchError(this.handleError)
      );
  }

  // DELETE - Supprimer tous les rôles
  deleteAllRoles(): Observable<string> {
    console.log(' DELETING ALL ROLES');

    const headers = this.getAuthHeaders();

    return this.http.delete(this.apiUrl, {
      responseType: 'text',
      headers
    }).pipe(
      tap(response => {
        console.log(' ALL ROLES DELETED SUCCESS:', response);
      }),
      catchError(this.handleError)
    );
  }

  // Méthode de debug pour vérifier l'état de l'authentification
  debugAuth(): void {
    console.log(' DEBUG ROLE SERVICE AUTH:');
    console.log('Token:', this.authService.getToken());
    console.log(' User:', this.authService.getUser());
    console.log(' User Roles:', this.authService.getUserRoles());
    console.log(' isHR:', this.authService.isHR());
    console.log(' isHRManager:', this.authService.isHRManager());
  }
}

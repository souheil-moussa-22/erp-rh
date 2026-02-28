import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
// Interfaces exportées
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface SignupResponse {
  username: string;
  email: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface JwtResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private router = inject(Router);
  private http = inject(HttpClient);

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userRolesSubject = new BehaviorSubject<string[]>(this.getStoredUserRoles());
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable();


  constructor() {}

  // Méthodes d'authentification
  signup(signupRequest: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/signup`, signupRequest)
      .pipe(
        catchError(this.handleError)
      );
  }

  login(loginRequest: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/signin`, loginRequest)
      .pipe(
        tap((response: JwtResponse) => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);

            const userData = {
              id: response.id,
              username: response.username,
              email: response.email,
              roles: response.roles
            };
            localStorage.setItem('user', JSON.stringify(userData));

            this.isLoggedInSubject.next(true);
            this.userRolesSubject.next(response.roles);
          } else {
            throw new Error('No token received');
          }
        }),
        catchError(this.handleError)
      );
  }

  resetPassword(resetRequest: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, resetRequest)
      .pipe(
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
    this.userRolesSubject.next([]);
    this.router.navigate(['/login']);
  }

  // ================= MÉTHODES POUR GÉRER LES RÔLES ET PERMISSIONS =================

  canCreateEmployees(): boolean {
    return this.isHRManager();
  }

  canDeleteEmployees(): boolean {
    return this.isHRManager();
  }

  canEditEmployees(): boolean {
    return this.isHR() || this.isHRManager();
  }

  canViewEmployeeList(): boolean {
    // RH ET RH MANAGERS PEUVENT VOIR LA LISTE DES EMPLOYÉS
    return this.isHR() || this.isHRManager();
  }
  canManageJobOffers(): boolean {
    return this.isHR() || this.isHRManager();
  }

  canCreateJobOffer(): boolean {
    return this.canManageJobOffers();
  }

  canEditJobOffer(): boolean {
    return this.canManageJobOffers();
  }

  canDeleteJobOffer(): boolean {
    return this.canManageJobOffers();
  }

  canManageFormations(): boolean {
    return this.isHR() || this.isHRManager();
  }

  canCreateFormation(): boolean {
    return this.canManageFormations();
  }

  canEditFormation(): boolean {
    return this.canManageFormations();
  }

  canDeleteFormation(): boolean {
    return this.canManageFormations();
  }

  canAssignFormation(): boolean {
    return this.canManageFormations();
  }

// Vérifie si l'utilisateur peut gérer une formation spécifique
  canManageFormation(formationId?: string): boolean {
    // Si c'est un RH ou HR Manager, il peut gérer toutes les formations
    return this.canManageFormations();
  }

// Vérifie si l'utilisateur peut gérer une offre d'emploi spécifique
  canManageJobOffer(jobId?: string): boolean {
    return this.canManageJobOffers();
  }
  getUserRole(): string {
    const user = this.getUser();
    return user?.roles?.[0] || '';
  }

  getUserRoles(): string[] {
    const user = this.getUser();
    return user?.roles || [];
  }


  getCurrentUserId(): string | null {
    const user = this.getUser();
    return user?.id ?? null;
  }

  getUser(): any {
    const userJson = localStorage.getItem('user');
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }


  isEmployee(): boolean {
    return this.getUserRoles().includes('ROLE_EMPLOYEE');
  }


  isHR(): boolean {
    const roles = this.getUserRoles();


    if (!roles || !Array.isArray(roles)) {
      return false;
    }

    // Vérifier tous les formats possibles
    const isHR = roles.some(role => {
      const normalizedRole = role.toUpperCase().trim();
      return normalizedRole === 'ROLE_RH' ||
        normalizedRole === 'RH' ||
        normalizedRole === 'ROLE_HR' ||
        normalizedRole === 'HR';
    });

    return isHR;
  }

  isHRManager(): boolean {
    const roles = this.getUserRoles();
    const isHRManager = roles.includes('ROLE_HRMANAGER') || roles.includes('ROLE_HR_MANAGER');
    return isHRManager;
  }

  isHRorManager(): boolean {
    return this.isHR() || this.isHRManager();
  }

// vérifier si l'utilisateur peut voir les formations
  canViewFormations(): boolean {
    return this.isHRorManager();
  }
  // Vérifier si l'utilisateur peut accéder au dashboard
  canAccessDashboard(): boolean {
    return this.isHRorManager();
  }

  canAccessFormations(): boolean {
    const roles = this.getUserRoles();

    // Liste de tous les rôles qui peuvent accéder aux formations
    const allowedRoles = [
      'ROLE_RH', 'ROLE_HR',
      'ROLE_HRMANAGER', 'ROLE_HR_MANAGER',
      'ROLE_ADMIN', 'ROLE_MANAGER'
    ];

    return allowedRoles.some(role => roles.includes(role));
  }
  canViewRoles(): boolean {
    return this.isHRManager();
  }
  canViewJobs(): boolean {
    return this.isHRorManager();
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return requiredRoles.some(role => userRoles.includes(role));
  }

  hasAllRoles(requiredRoles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return requiredRoles.every(role => userRoles.includes(role));
  }

  // ================= MÉTHODES POUR LA GESTION DES PERMISSIONS =================

  canAccessEmployeeProfile(employeeId: string): boolean {
    return this.isHRorManager() || this.getCurrentUserId() === employeeId;
  }

  // Vérifier si l'utilisateur peut voir l'historique des fiches de paie
  canViewPayslipHistory(employeeId: string): boolean {
    return this.isHRorManager() || this.getCurrentUserId() === employeeId;
  }

  // Vérifier si l'utilisateur peut générer des fiches de paie
  canGeneratePayslip(employeeId: string): boolean {
    return this.isHRorManager() || this.getCurrentUserId() === employeeId;
  }

  canEditEmployeeProfile(employeeId: string): boolean {
    return this.isHRorManager() && this.getCurrentUserId() !== employeeId;
  }

  canUploadEmployeePhoto(employeeId: string): boolean {
    return this.isHRorManager() && this.getCurrentUserId() !== employeeId;
  }

  canManageJobs(): boolean {
    return this.isHRorManager();
  }

  // ================= GETTERS BASIQUES =================

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  getAuthStatus(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getUserRolesObservable(): Observable<string[]> {
    return this.userRolesSubject.asObservable();
  }

  // ================= MÉTHODES PRIVÉES =================

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  private getStoredUserRoles(): string[] {
    const user = this.getUser();
    return user?.roles || [];
  }

  private handleError(error: any) {
    let errorMessage = 'Une erreur est survenue!';

    if (error.status === 401) {
      errorMessage = 'Email ou mot de passe incorrect.';
    } else if (error.status === 403) {
      errorMessage = 'Accès refusé. Permissions insuffisantes.';
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => errorMessage);
  }
  canChangePassword(employeeId: string): boolean {
    return this.getCurrentUserId() === employeeId;
  }

  // Dans auth.service.ts
  canViewConges(): boolean {
    // Exemple : Tous les utilisateurs connectés peuvent voir leurs congés
    return this.isEmployee();
  }

  canManageConges(): boolean {
    // Exemple : Seuls HR et HR Manager peuvent gérer les congés des autres
    return this.isHR() || this.isHRManager();
  }
}

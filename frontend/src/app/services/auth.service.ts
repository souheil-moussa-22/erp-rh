import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
  private apiUrl = 'http://localhost:8081/api/auth';
  private router = inject(Router);
  private http = inject(HttpClient);

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userRolesSubject = new BehaviorSubject<string[]>(this.getStoredUserRoles());
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable();


  constructor() {
    console.log(' AuthService initialisé');
    console.log('Token initial:', this.getToken() ? 'PRÉSENT' : 'NULL');
  }

  // Méthodes d'authentification
  signup(signupRequest: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/signup`, signupRequest)
      .pipe(
        catchError(this.handleError)
      );
  }


  // login(loginRequest: LoginRequest): Observable<JwtResponse> {
  //   return this.http.post<JwtResponse>(`${this.apiUrl}/signin`, loginRequest)
  //     .pipe(
  //       tap((response: JwtResponse) => {
  //         // Store token and user info
  //         localStorage.setItem('authToken', response.token);
  //         localStorage.setItem('user', JSON.stringify({
  //           id: response.id,
  //           username: response.username,
  //           email: response.email,
  //           roles: response.roles
  //         }));
  //         this.isLoggedInSubject.next(true);
  //       }),
  //       catchError(this.handleError)
  //     );
  // }

  login(loginRequest: LoginRequest): Observable<JwtResponse> {
    console.log(' Tentative de login vers:', `${this.apiUrl}/signin`);

    return this.http.post<JwtResponse>(`${this.apiUrl}/signin`, loginRequest)
      .pipe(
        tap((response: JwtResponse) => {
          console.log(' Réponse login reçue:', response);

          if (response.token) {
            // Stocker le token correctement
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

            console.log(' Token stocké avec succès');
            console.log(' User ID:', response.id);
            console.log('Roles:', response.roles);

            this.decodeToken();
          } else {
            console.error(' Pas de token dans la réponse');
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
    console.log(' Déconnexion en cours...');

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
    this.userRolesSubject.next([]);

    console.log(' Données localStorage nettoyées');
    console.log(' Nouvel état isLoggedIn:', false);

    this.router.navigate(['/login']);
  }

  // ================= MÉTHODES POUR GÉRER LES RÔLES ET PERMISSIONS =================

  canCreateEmployees(): boolean {
    // SEUL LE RH MANAGER PEUT CRÉER DES EMPLOYÉS
    const canCreate = this.isHRManager();
    console.log(' canCreateEmployees:', canCreate);
    return canCreate;
  }

  canDeleteEmployees(): boolean {
    // SEUL LE RH MANAGER PEUT SUPPRIMER DES EMPLOYÉS
    const canDelete = this.isHRManager();
    console.log(' canDeleteEmployees:', canDelete);
    return canDelete;
  }

  canEditEmployees(): boolean {
    // RH ET RH MANAGERS PEUVENT ÉDITER LES EMPLOYÉS
    const canEdit = this.isHR() || this.isHRManager();
    console.log(' canEditEmployees:', canEdit);
    return canEdit;
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
    console.log(' getCurrentUserId - user data:', user);

    if (user && user.id) {
      console.log('User ID found:', user.id);
      return user.id;
    }

    console.log(' User ID not found - user object:', user);
    return null;
  }

  getUser(): any {
    const userJson = localStorage.getItem('user');
    console.log(' getUser - raw JSON from localStorage:', userJson);

    try {
      const user = userJson ? JSON.parse(userJson) : null;
      console.log(' getUser - parsed user:', user);
      return user;
    } catch (error) {
      console.error(' Erreur parsing user data:', error);
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
    // SEUL LE RH MANAGER PEUT VOIR LA LISTE DES RÔLES
    const canView = this.isHRManager();
    console.log('canViewRoles:', canView);
    return canView;
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
    const currentUserId = this.getCurrentUserId();
    const isHRorManager = this.isHRorManager();
    const isOwnProfile = currentUserId === employeeId;

    console.log(' canAccessEmployeeProfile check:');
    console.log('   - Employee ID:', employeeId);
    console.log('   - Current User ID:', currentUserId);
    console.log('   - Is HR/Manager:', isHRorManager);
    console.log('   - Is Own Profile:', isOwnProfile);
    console.log('   - Result:', isHRorManager || isOwnProfile);

    return isHRorManager || isOwnProfile;
  }

  // Vérifier si l'utilisateur peut voir l'historique des fiches de paie
  canViewPayslipHistory(employeeId: string): boolean {
    const currentUserId = this.getCurrentUserId();
    const isHRorManager = this.isHRorManager();
    const isOwnProfile = currentUserId === employeeId;

    console.log(' canViewPayslipHistory Check:');
    console.log('   - Employee ID:', employeeId);
    console.log('   - Current User ID:', currentUserId);
    console.log('   - isHR/Manager:', isHRorManager);
    console.log('   - isOwnProfile:', isOwnProfile);
    console.log('   - Result:', isHRorManager || isOwnProfile);

    return isHRorManager || isOwnProfile;
  }

  // Vérifier si l'utilisateur peut générer des fiches de paie
  canGeneratePayslip(employeeId: string): boolean {
    const currentUserId = this.getCurrentUserId();
    const isHRorManager = this.isHRorManager();
    const isOwnProfile = currentUserId === employeeId;

    // Les RH peuvent générer pour tous, les employés seulement pour eux-mêmes
    return isHRorManager || isOwnProfile;
  }

  canEditEmployeeProfile(employeeId: string): boolean {
    // SEULS LES RH PEUVENT ÉDITER LES PROFILS
    const currentUserId = this.getCurrentUserId();
    const isHRorManager = this.isHRorManager();
    const isOwnProfile = currentUserId === employeeId;

    // Les RH peuvent éditer tous les profils
    // Les employés ne peuvent éditer que leur propre profil via "Mon Profil"
    const canEdit = isHRorManager && !isOwnProfile;

    console.log(' canEditEmployeeProfile:');
    console.log('   - Employee ID:', employeeId);
    console.log('   - Current User ID:', currentUserId);
    console.log('   - Is HR/Manager:', isHRorManager);
    console.log('   - Is Own Profile:', isOwnProfile);
    console.log('   - Result:', canEdit);

    return canEdit;
  }

  canUploadEmployeePhoto(employeeId: string): boolean {
    // SEULS LES RH PEUVENT UPLOADER DES PHOTOS
    const currentUserId = this.getCurrentUserId();
    const isHRorManager = this.isHRorManager();
    const isOwnProfile = currentUserId === employeeId;

    const canUpload = isHRorManager && !isOwnProfile;

    console.log(' canUploadEmployeePhoto:', canUpload);
    return canUpload;
  }

  canManageJobs(): boolean {
    return this.isHRorManager();
  }

  // ================= GETTERS BASIQUES =================

  getToken(): string | null {
    const token = localStorage.getItem('authToken');
    return token;
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
  debugCurrentUser(): void {
    console.log(' DEBUG CURRENT USER:');
    console.log('  - Token:', this.getToken() ? 'PRESENT' : 'NULL');
    console.log('  - User:', this.getUser());
    console.log('  - Roles:', this.getUserRoles());
    console.log('  - isHR():', this.isHR());
    console.log('  - isHRManager():', this.isHRManager());
    console.log('  - isEmployee():', this.isEmployee());
  }
  // ================= MÉTHODES DE DEBUG =================

  debugAuth(): void {
    console.log(' DEBUG AUTH SERVICE:');
    console.log(' Token:', this.getToken());
    console.log(' User:', this.getUser());
    console.log(' isLoggedIn:', this.isLoggedIn());
    console.log(' Roles:', this.getUserRoles());
    console.log(' localStorage authToken:', localStorage.getItem('authToken'));
    console.log(' localStorage user:', localStorage.getItem('user'));
    console.log('isHR:', this.isHR());
    console.log(' isHRManager:', this.isHRManager());
    console.log(' isEmployee:', this.isEmployee());
    console.log('isHRorManager:', this.isHRorManager());
    console.log('canViewEmployeeList:', this.canViewEmployeeList());
    console.log(' canViewJobs:', this.canViewJobs());
    console.log(' canManageJobs:', this.canManageJobs());
  }

  decodeToken(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log(' Token payload:', payload);
        console.log(' Token expiration:', new Date(payload.exp * 1000));
      } catch (error) {
        console.error(' Error decoding token:', error);
      }
    }
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
    console.error(' Erreur AuthService:', error);
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
    const currentUserId = this.getCurrentUserId();
    const isOwnProfile = currentUserId === employeeId;

    console.log('canChangePassword Check:');
    console.log('   - Employee ID:', employeeId);
    console.log('   - Current User ID:', currentUserId);
    console.log('   - Is Own Profile:', isOwnProfile);
    console.log('   - Result:', isOwnProfile);

    return isOwnProfile;
  }
  debugToken(): void {
    const token = this.getToken();
    if (token) {
      console.log(' Token Debug:');
      console.log('   - Présent:', !!token);
      console.log('   - Longueur:', token.length);

      try {
        // Décoder le payload JWT (partie entre les deux points)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('   - Payload:', payload);
        console.log('   - Expiration:', new Date(payload.exp * 1000));
        console.log('   - Email:', payload.email);
        console.log('   - Roles:', payload.roles);
      } catch (error) {
        console.error(' Erreur décodage token:', error);
      }
    } else {
      console.warn(' Aucun token trouvé');
    }
  }
  debugLoginResponse(loginRequest: LoginRequest): void {
    console.log(' DEBUG: Testing login response format');

    this.http.post<any>(`${this.apiUrl}/signin`, loginRequest).subscribe({
      next: (rawResponse) => {
        console.log('RAW LOGIN RESPONSE:', rawResponse);
        console.log(' Response keys:', Object.keys(rawResponse));
        console.log(' Token field name:',
          rawResponse.accessToken ? 'accessToken' :
            rawResponse.token ? 'token' :
              'UNKNOWN');
      },
      error: (error) => {
        console.error(' Debug login failed:', error);
      }
    });
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

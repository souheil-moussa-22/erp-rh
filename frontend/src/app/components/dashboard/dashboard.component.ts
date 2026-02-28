import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import {ChatbotComponent} from '../chatbot/chatbot';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ChatbotComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  showChatbot = false;
  hasNewMessages = false;
  canViewEmployees: boolean = false;
  canCreateEmployees: boolean = false;
  canViewJobs: boolean = false;
  canViewFormations: boolean = false;
  canViewConges: boolean = false;
  canManageConges: boolean = false;
  canSubmitConges: boolean = false;
  canViewRoles: boolean = false;
  isHRManager: boolean = false;
  userRole: string = '';
  currentUserId: string | null = null;
  private rolesSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.updatePermissions();

    this.rolesSubscription = this.authService.getUserRolesObservable().subscribe(roles => {
      this.updatePermissions();
    });

    console.log('👤 User connected with role:', this.userRole);

    // Redirection automatique
    this.redirectIfNeeded();
  }

  private updatePermissions() {
    this.isHRManager = this.authService.isHRManager();
    this.canCreateEmployees = this.authService.canCreateEmployees();
    this.canViewEmployees = this.authService.canViewEmployeeList();
    this.canViewJobs = this.authService.isHR() || this.authService.isHRManager();
    this.canViewFormations = this.authService.isHR() || this.authService.isHRManager();
    this.canViewConges = this.canViewCongesPermission(); // <-- AJOUTÉ
    this.canManageConges = this.authService.canManageConges();
    this.canSubmitConges = this.authService.isEmployee();
    this.userRole = this.authService.getUserRole();
    this.currentUserId = this.authService.getCurrentUserId();
    this.canViewRoles = this.authService.canViewRoles();


    console.log(' Permissions updated:');
    console.log('   - isHRManager:', this.isHRManager);
    console.log('   - canCreateEmployees:', this.canCreateEmployees);
    console.log('   - canViewEmployees:', this.canViewEmployees);
    console.log('   - canViewJobs:', this.canViewJobs);
    console.log('   - canViewFormations:', this.canViewFormations);
    console.log('   - canViewConges:', this.canViewConges); // <-- AJOUTÉ
    console.log('   - userRole:', this.userRole);
    console.log('   - currentUserId:', this.currentUserId);
  }
  private canViewCongesPermission(): boolean {
    return this.authService.canViewConges();
  }

  private redirectIfNeeded() {
    // Si l'employé est sur la liste des employés, le rediriger vers son profil
    if (this.router.url === '/employees' && !this.canViewEmployees && this.currentUserId) {
      console.log(' Redirecting employee to their profile');
      this.router.navigate(['/employees', this.currentUserId]);
    }

    // Redirection si employé essaie d'accéder aux offres d'emploi
    if (this.router.url === '/jobs' && !this.canViewJobs && this.currentUserId) {
      console.log(' Redirecting employee from jobs to their profile');
      this.router.navigate(['/employees', this.currentUserId]);
    }

    // Redirection si employé essaie d'accéder aux formations
    if (this.router.url === '/formations' && !this.canViewFormations && this.currentUserId) {
      console.log(' Redirecting employee from formations to their profile');
      this.router.navigate(['/employees', this.currentUserId]);
    }

    // Redirection si utilisateur essaie d'accéder aux congés sans permission
    if (this.router.url === '/mes-conges' && !this.canViewConges && this.currentUserId) {
      console.log(' Redirecting user from congés to their profile');
      this.router.navigate(['/employees', this.currentUserId]);
    }
  }


  getMyProfileLink(): string {
    return this.currentUserId ? `/employees/${this.currentUserId}` : '/login';
  }

  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
    if (this.showChatbot) {
      this.hasNewMessages = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy() {
    if (this.rolesSubscription) {
      this.rolesSubscription.unsubscribe();
    }

  }

}

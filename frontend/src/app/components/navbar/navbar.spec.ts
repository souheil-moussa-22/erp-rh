// navbar.component.ts
import { Component, HostListener, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service'; // Ajustez le chemin selon votre structure

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit, OnDestroy {
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  isMobileToggleActive = false;
  userName = 'Utilisateur'; // Valeur par défaut
  userRoles: string[] = [];
  isLoggedIn = false;

  // Propriétés pour la recherche globale
  searchTerm = '';
  @Output() searchChange = new EventEmitter<string>();
  @Output() globalSearch = new EventEmitter<string>();

  private authSubscription: Subscription | undefined;
  private rolesSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.subscribeToAuthChanges();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.rolesSubscription) {
      this.rolesSubscription.unsubscribe();
    }
  }

  // Méthode pour charger les données utilisateur
  loadUserData(): void {
    // Vérifier si l'utilisateur est connecté
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.isLoggedIn) {
      // Récupérer l'utilisateur depuis localStorage via AuthService
      const user = this.authService.getUser();

      if (user) {
        console.log('User data from AuthService:', user);
        this.userName = user.username || user.email || 'Utilisateur';
        this.userRoles = user.roles || [];
      } else {
        console.warn('No user data found in localStorage');
        this.userName = 'Utilisateur';
      }
    } else {
      this.userName = 'Invité';
      this.userRoles = [];
    }
  }

  // S'abonner aux changements d'état d'authentification
  subscribeToAuthChanges(): void {
    // Observer l'état de connexion
    this.authSubscription = this.authService.getAuthStatus().subscribe(
      (loggedIn: boolean) => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.loadUserData(); // Recharger les données quand l'utilisateur se connecte
        } else {
          this.userName = 'Invité';
          this.userRoles = [];
        }
      }
    );

    // Observer les changements de rôles (optionnel)
    this.rolesSubscription = this.authService.getUserRolesObservable().subscribe(
      (roles: string[]) => {
        this.userRoles = roles;
        console.log('Roles updated in Navbar:', roles);
      }
    );
  }

  // Méthodes pour la recherche
  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
    this.globalSearch.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchChange.emit('');
    this.globalSearch.emit('');
  }

  // Méthode pour lancer une recherche globale
  performGlobalSearch(term: string): void {
    this.searchTerm = term;
    this.globalSearch.emit(term);
  }

  // Modifier la méthode logout pour utiliser AuthService
  logout(): void {
    console.log('Logout clicked');
    this.authService.logout(); // Utiliser la méthode du service
    this.closeAllMenus();
  }

  // Méthode pour afficher le rôle principal (optionnel)
  getMainRole(): string {
    if (this.userRoles.includes('ROLE_HRMANAGER') || this.userRoles.includes('ROLE_HR_MANAGER')) {
      return 'HR Manager';
    } else if (this.userRoles.includes('ROLE_RH') || this.userRoles.includes('ROLE_HR')) {
      return 'RH';
    } else if (this.userRoles.includes('ROLE_EMPLOYEE')) {
      return 'Employé';
    } else if (this.userRoles.includes('ROLE_ADMIN')) {
      return 'Admin';
    }
    return 'Utilisateur';
  }

  // Méthodes existantes...
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isMobileToggleActive = !this.isMobileToggleActive;
  }

  closeAllMenus(): void {
    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.isMobileToggleActive = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }

    if (!target.closest('.mobile-toggle') && !target.closest('.mobile-menu')) {
      this.closeAllMenus();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.closeAllMenus();
    }
  }
}

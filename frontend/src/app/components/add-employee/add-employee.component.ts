import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class AddEmployeeComponent implements OnInit {
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() employeeAdded = new EventEmitter<void>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // UI state
  isOpen = true;
  errorMessage = '';
  isLoading = false;        // utilisé pour spinner global
  isSubmitting = false;     // utilisé pour l'état du bouton submit
  passwordStrength = '';
  showSuccessAlert = false;
  successMessage = '';

  // permissions
  canAddEmployee = false;

  // listes disponibles
  availableRoles = [
    { value: 'ROLE_EMPLOYEE', label: 'Employé' },
    { value: 'ROLE_HR', label: 'RH' },
    { value: 'ROLE_HRMANAGER', label: 'Manager RH' }
  ];

  availableStatuses = [
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'INACTIVE', label: 'Inactif' },
    { value: 'ON_LEAVE', label: 'En congé' }
  ];

  // modèle employé (étendu) - NEW: champs additionnels
  employee: any = {
    username: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    hireDate: '',
    salary: null,
    position: '',
    customPosition: '',
    status: 'ACTIVE',
    role: 'ROLE_EMPLOYEE',
    cin: '',
    cnssNumber: '',
    matricule: '',
    workingDays: null,
    address: '',
    city: '',
    rib: '',
    bankName: '',
    transportAllowance: 0,
    familyAllowance: 0,
    otherBonuses: 0,
    actualWorkingDays: null
  };

  // Patterns
  private passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private cinPattern = /^[0-9A-Z\-]{4,}$/;       // simplifié (adapter si besoin)
  private cnssPattern = /^[0-9A-Za-z\-]{4,}$/;   // simplifié
  private ribPattern = /^[0-9A-Za-z]{6,}$/;      // simplifié

  ngOnInit(): void {
    this.checkPermissions();
  }

  /* ===========================
     Permissions & Auth Helpers
     =========================== */

  private checkPermissions(): void {
    try {
      this.canAddEmployee = this.authService.isHRorManager();
    } catch (e) {
      console.error('Erreur lors de la vérification des permissions', e);
      this.canAddEmployee = false;
    }

    if (!this.canAddEmployee) {
      this.errorMessage = 'Vous n\'avez pas les permissions pour ajouter un employé.';
    }
  }

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

  openModal() {
    this.checkPermissions();
    if (!this.canAddEmployee) return;

    this.isOpen = true;
    this.errorMessage = '';
    this.isLoading = false;
    this.isSubmitting = false;
    this.showSuccessAlert = false;
    this.employee.role = 'ROLE_EMPLOYEE';
    this.employee.status = 'ACTIVE';
    this.passwordStrength = '';
  }

  closeModal() {
    this.isOpen = false;
    this.closeModalEvent.emit();
  }

  /* ===========================
     Validations & Utils
     =========================== */

  validatePassword(password: string): boolean {
    return this.passwordPattern.test(password);
  }

  validateEmail(email: string): boolean {
    return this.emailPattern.test(email);
  }

  validateCIN(cin: string): boolean {
    if (!cin) return false;
    return this.cinPattern.test(cin);
  }

  validateCNSS(cnss: string): boolean {
    if (!cnss) return false;
    return this.cnssPattern.test(cnss);
  }

  validateRIB(rib: string): boolean {
    if (!rib) return true; // RIB optionnel ; retourne true si vide
    return this.ribPattern.test(rib);
  }


  // simple formatter téléphone (trivial) — peut être amélioré selon le format attendu
  formatPhone() {
    if (!this.employee.phone) return;
    // retirer espaces/tirets, puis ajouter un espace toutes les 2-3 chars si besoin — implémentation minimale:
    const cleaned = this.employee.phone.replace(/[^\d\+]/g, '');
    this.employee.phone = cleaned;
  }

  /* ===========================
     Validation Formulaire
     =========================== */

  validateForm(): boolean {
    this.errorMessage = '';

    if (!this.canAddEmployee) {
      this.errorMessage = 'Vous n\'avez pas les permissions pour ajouter un employé.';
      return false;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Vous n\'êtes pas connecté. Veuillez vous connecter d\'abord.';
      return false;
    }

    // champs obligatoires
    if (!this.employee.username || !this.employee.username.trim()) {
      this.errorMessage = 'Le nom complet est obligatoire.';
      return false;
    }

    if (!this.employee.email || !this.employee.email.trim()) {
      this.errorMessage = 'L\'email est obligatoire.';
      return false;
    }

    if (!this.validateEmail(this.employee.email)) {
      this.errorMessage = 'Veuillez entrer un email valide.';
      return false;
    }

    if (!this.employee.password) {
      this.errorMessage = 'Le mot de passe est obligatoire.';
      return false;
    }



    // CIN & CNSS (si fournis ou obligatoires selon ton UI)
    if (!this.employee.cin || !this.validateCIN(this.employee.cin)) {
      this.errorMessage = 'CIN invalide ou manquant.';
      return false;
    }

    if (!this.employee.cnssNumber || !this.validateCNSS(this.employee.cnssNumber)) {
      this.errorMessage = 'Numéro CNSS invalide ou manquant.';
      return false;
    }

    // si position = OTHER, customPosition requis
    if (this.employee.position === 'OTHER' && (!this.employee.customPosition || !this.employee.customPosition.trim())) {
      this.errorMessage = 'Veuillez spécifier le poste personnalisé.';
      return false;
    }

    // RIB validation (optionnel)
    if (!this.validateRIB(this.employee.rib)) {
      this.errorMessage = 'RIB invalide.';
      return false;
    }

    return true;
  }

  /* ===========================
     Envoi API
     =========================== */

  saveEmployee() {
    // protections
    if (!this.canAddEmployee) {
      this.errorMessage = 'Vous n\'avez pas les permissions pour ajouter un employé.';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Vous n\'êtes pas connecté. Veuillez vous connecter d\'abord.';
      return;
    }

    // formatter téléphone
    this.formatPhone();

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.isSubmitting = true;
    this.errorMessage = '';

    // Préparer le payload complet envoyé au backend
    const employeeData = {
      username: this.employee.username.trim(),
      email: this.employee.email.trim().toLowerCase(),
      password: this.employee.password,
      phone: this.employee.phone || '',
      gender: this.employee.gender || null,
      hireDate: this.employee.hireDate || null,
      salary: (this.employee.salary !== null && this.employee.salary !== '') ? Number(this.employee.salary) : null,
      position: this.employee.position === 'OTHER' ? this.employee.customPosition : this.employee.position,
      status: this.employee.status || 'Active',
      roleNames: [this.employee.role],
      // Paie / Identifiants tunisiens
      cin: this.employee.cin || '',
      cnssNumber: this.employee.cnssNumber || '',
      matricule: this.employee.matricule || '',
      workingDays: this.employee.workingDays !== null ? Number(this.employee.workingDays) : null,
      // Adresse & Banque
      address: this.employee.address || '',
      city: this.employee.city || '',
      rib: this.employee.rib || '',
      bankName: this.employee.bankName || '',
      // Primes / indemnités
      transportAllowance: this.employee.transportAllowance ? Number(this.employee.transportAllowance) : 0,
      familyAllowance: this.employee.familyAllowance ? Number(this.employee.familyAllowance) : 0,
      otherBonuses: this.employee.otherBonuses ? Number(this.employee.otherBonuses) : 0,
      actualWorkingDays: this.employee.actualWorkingDays !== null ? Number(this.employee.actualWorkingDays) : null
    };

    const headers = this.getAuthHeaders();

    this.http.post(`${environment.apiUrl}/api/employees/Add-employee`, employeeData, {
      headers: headers,
      observe: 'response',
      responseType: 'text' as 'json'
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSubmitting = false;

        if (response && response.status >= 200 && response.status < 300) {
          this.showSuccessMessage();
          this.resetForm();
          this.employeeAdded.emit();
          this.closeModal();
        } else {
          // certains backends renvoient texte seulement — gérer prudemment
          this.errorMessage = 'Réponse inattendue du serveur.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.isSubmitting = false;

        if (error.status === 401) {
          this.errorMessage = 'Authentification échouée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          // tenter d'extraire message serveur si présent
          this.errorMessage = error.error ? String(error.error) : 'Données invalides. Vérifiez les informations.';
        } else if (error.status === 403) {
          this.errorMessage = 'Vous n\'avez pas les permissions pour ajouter un employé.';
        } else if (error.status === 409) {
          this.errorMessage = 'Un employé avec cet email existe déjà.';
        } else if (error.status === 500) {
          this.errorMessage = 'Erreur interne du serveur. Veuillez réessayer.';
        } else {
          this.errorMessage = `Erreur: ${error.message}`;
        }
      }
    });
  }

  private showSuccessMessage() {
    this.successMessage = 'Employé créé avec succès';
    this.showSuccessAlert = true;
    setTimeout(() => this.showSuccessAlert = false, 5000);
  }

  private resetForm() {
    this.employee = {
      username: '',
      email: '',
      password: '',
      phone: '',
      gender: '',
      hireDate: '',
      salary: null,
      position: '',
      customPosition: '',
      status: 'ACTIVE',
      role: 'ROLE_EMPLOYEE',
      cin: '',
      cnssNumber: '',
      matricule: '',
      workingDays: null,
      address: '',
      city: '',
      rib: '',
      bankName: '',
      transportAllowance: 0,
      familyAllowance: 0,
      otherBonuses: 0,
      actualWorkingDays: null
    };
    this.passwordStrength = '';
    this.isLoading = false;
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  // Utilitaire debug
}


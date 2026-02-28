import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmployeeServices, Payslip, Employee } from '../../services/employee.service';
import { CalculationsService } from '../../services/calculations.service';
import { PdfGenerationService } from '../../services/pdf-generation.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service'; // Service d'authentification
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-payslip-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payslip-history.component.html',
  styleUrls: ['./payslip-history.component.css']
})
export class PayslipHistoryComponent implements OnInit, OnDestroy {
  payslipHistory: Payslip[] = [];
  availableYears: number[] = [];
  currentYear: number = new Date().getFullYear();
  selectedYear: number = this.currentYear;
  selectedYearForGeneration: number = this.currentYear;
  employeeId: string = '';
  employeeName: string = '';
  employeeMatricule: string = '';
  employeeHireYear: number = 0;
  employeeHireMonth: number = 0;
  employeeHireDay: number = 0;
  loading = false;
  errorMessage = '';
  hasData = true;
  generatingPayslip = false;
  successMessage = '';

  // Modal
  currentPdfUrl: SafeResourceUrl | null = null;
  payslipLoading: boolean = false;
  showPayslipModal: boolean = false;
  currentPayslip: any = null;

  currentEmployee: Employee = {
    id: '',
    username: '',
    email: '',
    hireDate: undefined,
    salary: 0,
    matricule: '',
    transportAllowance: 0,
    familyAllowance: 0,
    otherBonuses: 0,
    status: '',
    phone: '',
    cin: '',
    cnssNumber: '',
    position: '',
    address: '',
    city: '',
    rib: '',
    bankName: '',
    workingDays: 22,
    actualWorkingDays: 22,
    employee: undefined,
    photoUrl: undefined,
    photoId: undefined,
    formations: [],
    seniorityBonus: 0,
    yearsOfService: 0,
    monthsOfService: 0,
    bonusPeriods: 0,
    traditionalSeniorityBonus: 0,
    nineDinarsBonus: 0
  };

  currentLanguage: 'fr' | 'en' = 'fr';
  debugMode: boolean = false;

  // Permissions
  currentUserId: string = '';
  userRole: string = '';
  canViewAllEmployees: boolean = false;
  canGeneratePayslips: boolean = false;
  canPerformAllActions: boolean = false;
  isViewingOwnProfile: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeServices,
    private calculationsService: CalculationsService,
    private pdfGenerationService: PdfGenerationService,
    private sanitizer: DomSanitizer,
    private translationService: TranslationService,
    private authService: AuthService, // Service d'authentification
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log(' === INIT PAYSLIP HISTORY COMPONENT ===');

    // Initialiser les permissions utilisateur
    this.initializeUserPermissions();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.handleRouteChange();
    });

    this.handleRouteChange();
  }

  private initializeUserPermissions() {
    // Utiliser les méthodes existantes de AuthService
    const currentUser = this.authService.getUser();

    if (currentUser) {
      this.currentUserId = currentUser.id;

      // Utiliser les méthodes de vérification de rôle existantes
      this.canViewAllEmployees = this.authService.isHR() || this.authService.isHRManager();
      this.canGeneratePayslips = this.authService.isHR() || this.authService.isHRManager();
      this.canPerformAllActions = this.authService.isHR() || this.authService.isHRManager();

      // Déterminer le rôle principal pour l'affichage
      if (this.authService.isHRManager()) {
        this.userRole = 'ROLE_HRMANAGER';
      } else if (this.authService.isHR()) {
        this.userRole = 'ROLE_HR';
      } else {
        this.userRole = 'ROLE_EMPLOYEE';
      }

      console.log('Permissions utilisateur:', {
        userId: this.currentUserId,
        role: this.userRole,
        isHR: this.authService.isHR(),
        isHRManager: this.authService.isHRManager(),
        isEmployee: this.authService.isEmployee(),
        canViewAllEmployees: this.canViewAllEmployees,
        canGeneratePayslips: this.canGeneratePayslips,
        canPerformAllActions: this.canPerformAllActions
      });
    } else {
      console.warn('No logged-in users found');
      this.setDefaultPermissions();
    }
  }
  private checkAccessPermissions() {
    this.isViewingOwnProfile = this.employeeId === this.currentUserId;

    // Si l'utilisateur n'est pas RH/Manager RH et essaie d'accéder à un autre employé
    if (!this.isViewingOwnProfile && !this.canViewAllEmployees) {
      this.errorMessage = 'You do not have permission to access this page';
      this.loading = false;
      this.router.navigate(['/unauthorized']);
      return;
    }

    console.log('Access permissions:', {
      isViewingOwnProfile: this.isViewingOwnProfile,
      canViewAllEmployees: this.canViewAllEmployees,
      employeeId: this.employeeId,
      currentUserId: this.currentUserId,
      userRole: this.userRole
    });
  }
  private setDefaultPermissions() {
    this.currentUserId = '';
    this.userRole = 'ROLE_EMPLOYEE';
    this.canViewAllEmployees = false;
    this.canGeneratePayslips = false;
    this.canPerformAllActions = false;
  }
  private handleRouteChange() {
    const newEmployeeId = this.route.snapshot.paramMap.get('id');
    console.log(' ID employé depuis la route:', newEmployeeId);

    if (!newEmployeeId) {
      this.errorMessage = ' ID employé manquant dans l\'URL';
      this.loading = false;
      return;
    }

    this.employeeId = newEmployeeId;

    // Vérifier si l'utilisateur a le droit de voir cet employé
    this.checkAccessPermissions();

    this.resetComponent();
    this.loadEmployeeInfo();
  }
  handleBackNavigation() {
    if (this.canViewAllEmployees) {
      // RH/Manager RH - Retour au profil de l'employé
      this.viewEmployeeDetails();
    } else if (this.isViewingOwnProfile) {
      // Employé normal - Retour au dashboard
      this.backToDashboard();
    }
  }

  viewEmployeeDetails() {
    this.router.navigate(['/employees', this.employeeId]);
  }

  backToDashboard() {
    // Rediriger vers le dashboard approprié selon le rôle
    if (this.authService.isHR() || this.authService.isHRManager()) {
      this.router.navigate(['/hr-dashboard']);
    } else {
      this.router.navigate(['/employee-dashboard']);
    }
  }

  backToEmployeeList() {
    this.router.navigate(['/employees']);
  }

  private resetComponent() {
    console.log(' Réinitialisation du composant pour le nouvel employé');

    this.payslipHistory = [];
    this.availableYears = [];
    this.currentYear = new Date().getFullYear();
    this.selectedYear = this.currentYear;
    this.selectedYearForGeneration = this.currentYear;
    this.employeeName = 'Chargement...';
    this.employeeMatricule = '';
    this.employeeHireYear = 0;
    this.employeeHireMonth = 0;
    this.employeeHireDay = 0;
    this.loading = true;
    this.errorMessage = '';
    this.hasData = false;
    this.generatingPayslip = false;
    this.successMessage = '';
    this.currentPdfUrl = null;
    this.showPayslipModal = false;
    this.currentPayslip = null;

    this.currentEmployee = {
      id: '',
      username: '',
      email: '',
      hireDate: undefined,
      salary: 0,
      matricule: '',
      transportAllowance: 0,
      familyAllowance: 0,
      otherBonuses: 0,
      status: '',
      phone: '',
      cin: '',
      cnssNumber: '',
      position: '',
      address: '',
      city: '',
      rib: '',
      bankName: '',
      workingDays: 22,
      actualWorkingDays: 22,
      employee: undefined,
      photoUrl: undefined,
      photoId: undefined,
      formations: [],
      seniorityBonus: 0,
      yearsOfService: 0,
      monthsOfService: 0,
      bonusPeriods: 0,
      traditionalSeniorityBonus: 0,
      nineDinarsBonus: 0
    };

    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.currentPdfUrl) {
      URL.revokeObjectURL(this.currentPdfUrl.toString());
    }
  }

  loadEmployeeInfo() {
    console.log(' Chargement des informations pour l\'employé ID:', this.employeeId);

    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (employee: Employee) => {
        console.log(' Employé chargé avec succès:', employee);

        if (!employee) {
          this.errorMessage = ' Employee not found';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.currentEmployee = employee;
        this.employeeName = employee.username || 'Name unknown';
        this.employeeMatricule = employee.matricule || employee.id || 'N/A';

        console.log(' Informations employé:');
        console.log('   - Nom:', this.employeeName);
        console.log('   - Matricule:', this.employeeMatricule);
        console.log('   - Email:', employee.email);
        console.log('   - Salaire:', employee.salary);

        if (employee.hireDate) {
          const hireDate = new Date(employee.hireDate);
          this.employeeHireYear = hireDate.getFullYear();
          this.employeeHireMonth = hireDate.getMonth() + 1;
          this.employeeHireDay = hireDate.getDate();
          console.log('   - HireDate:', `${this.employeeHireDay}/${this.employeeHireMonth}/${this.employeeHireYear}`);
        } else {
          this.employeeHireYear = new Date().getFullYear();
          this.employeeHireMonth = 1;
          this.employeeHireDay = 1;
          console.log('   - Date d\'embauche: Non définie');
        }

        this.cdr.detectChanges();
        this.loadAvailableYears();
      },
      error: (error: any) => {
        console.error(' Erreur chargement employé:', error);
        this.errorMessage = ` Error loading employee information: ${error.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAvailableYears() {
    console.log(' Loading available years for:', this.employeeId);

    this.employeeService.getAvailableYears(this.employeeId).subscribe({
      next: (years: number[]) => {
        console.log(' Années disponibles du backend:', years);

        if (years && years.length > 0) {
          this.availableYears = years.sort((a, b) => b - a);
        } else {
          this.availableYears = this.generateYearsFromHireDate();
        }

        console.log(' Années disponibles finales:', this.availableYears);

        this.selectedYear = this.availableYears[0] || this.currentYear;
        this.selectedYearForGeneration = this.selectedYear;
        console.log(' Année sélectionnée:', this.selectedYear);

        this.loadPayslipsForYear(this.selectedYear);
      },
      error: (error: any) => {
        console.error(' Erreur chargement années:', error);
        this.availableYears = this.generateYearsFromHireDate();
        this.selectedYear = this.availableYears[0] || this.currentYear;
        this.selectedYearForGeneration = this.selectedYear;
        this.loadPayslipsForYear(this.selectedYear);
      }
    });
  }

  private generateYearsFromHireDate(): number[] {
    if (!this.currentEmployee?.hireDate) {
      const years: number[] = [];
      for (let year = this.currentYear; year >= this.currentYear - 5; year--) {
        years.push(year);
      }
      console.log(' Années par défaut (pas de date d\'embauche):', years);
      return years;
    }

    const hireDate = new Date(this.currentEmployee.hireDate);
    const hireYear = hireDate.getFullYear();

    const years: number[] = [];
    for (let year = hireYear; year <= this.currentYear; year++) {
      years.push(year);
    }

    console.log(' Années générées depuis embauche:', years);
    return years.sort((a, b) => b - a);
  }
// Charger les fiches de paie pour une année spécifique
  loadPayslipsForYear(year: number) {
    console.log(` Chargement des fiches pour: ${this.employeeName} (${this.employeeId}), année: ${year}`);

    this.loading = true;
    this.errorMessage = '';

    this.employeeService.getEmployeePayslipsByYear(this.employeeId, year).subscribe({
      next: (payslips: Payslip[]) => {
        console.log(` Fiches reçues pour ${year}:`, payslips);

        if (!payslips) {
          console.log('️ Aucune fiche reçue (null)');
          this.payslipHistory = [];
        } else {
          this.payslipHistory = payslips;
        }

        this.hasData = this.payslipHistory.length > 0;
        this.loading = false;

        console.log(` ${this.payslipHistory.length} fiche(s) chargée(s) pour ${year}`);
        this.performDataDiagnosis();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error(`Erreur chargement fiches pour ${year}:`, error);
        this.fallbackLoadPayslips(year);
      }
    });
  }

  private fallbackLoadPayslips(year: number) {
    console.log(' Tentative de chargement de fallback...');

    this.employeeService.getEmployeePayslips(this.employeeId).subscribe({
      next: (allPayslips: Payslip[]) => {
        console.log(' Toutes les fiches (fallback):', allPayslips);

        if (!allPayslips) {
          this.payslipHistory = [];
        } else {
          const filteredPayslips = allPayslips.filter(payslip => {
            const payslipYear = Number(payslip.year);
            const searchYear = Number(year);
            return payslipYear === searchYear;
          });

          console.log(` Fiches filtrées pour ${year}:`, filteredPayslips.length);
          this.payslipHistory = filteredPayslips;
        }

        this.hasData = this.payslipHistory.length > 0;
        this.loading = false;

        if (!this.hasData) {
          this.errorMessage = `Aucune fiche de paie trouvée pour ${year}`;
        }

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error(' Erreur chargement fallback:', error);
        this.payslipHistory = [];
        this.hasData = false;
        this.loading = false;
        this.errorMessage = `No payslips found for ${year}`;
        this.cdr.detectChanges();
      }
    });
  }

  private performDataDiagnosis() {
    console.log(' === DIAGNOSTIC DES DONNÉES ===');
    console.log(' Employé:', this.employeeName);
    console.log(' Année sélectionnée:', this.selectedYear);
    console.log(' Fiches chargées:', this.payslipHistory.length);

    this.payslipHistory.forEach((payslip, index) => {
      console.log(`   ${index + 1}. ${payslip.period} - Mois: ${payslip.month} - Année: ${payslip.year}`);
    });

    console.log(' État des mois:');
    for (let month = 1; month <= 12; month++) {
      const hasPayslip = this.hasPayslipForMonth(month);
      console.log(`   ${month}/${this.selectedYear}: ${hasPayslip ? ' Fiche' : ' Sans fiche'}`);
    }

    console.log('=== FIN DIAGNOSTIC ===');
  }



  generateTestPayslips() {
    // Vérifier les permissions
    if (!this.canUserGeneratePayslips()) {
      this.errorMessage = ' You do not have permission to access this page';
      return;
    }

    console.log(' Generating test results for:', this.employeeName);

    const targetYear = this.selectedYear;
    console.log(' Année cible pour la fiche de test:', targetYear);

    // DÉTERMINER LE MOIS À GÉNÉRER - MÊME LOGIQUE QUE LA GÉNÉRATION ANNUELLE
    let monthToGenerate: number;

    if (this.selectedYear < this.currentYear) {
      // Année passée : Générer Décembre (comme la génération annuelle)
      monthToGenerate = 12;
      console.log(` Année passée ${targetYear} - Génération de Décembre`);
    } else if (this.selectedYear === this.currentYear) {
      // Année actuelle : Générer le mois actuel
      const currentMonth = new Date().getMonth() + 1;
      monthToGenerate = currentMonth;
      console.log(` Année actuelle ${targetYear} - Génération du mois actuel: ${monthToGenerate}`);
    } else {
      // Année future : Ne devrait pas arriver normalement
      return;
    }

    this.generatingPayslip = true;
    this.errorMessage = '';
    this.successMessage = ` Generating payslips for ${this.getMonthName(monthToGenerate)} ${targetYear} in progress...`;

    // VÉRIFICATIONS IDENTIQUES À LA GÉNÉRATION ANNUELLE
    if (!this.isMonthAvailableForGeneration(targetYear, monthToGenerate)) {
      this.generatingPayslip = false;
      return;
    }

    if (this.isMonthInFuture(targetYear, monthToGenerate)) {
      this.generatingPayslip = false;
      return;
    }

    console.log(` Génération fiche test: ${monthToGenerate}/${targetYear}`);

    this.employeeService.generatePayslipForMonth(this.employeeId, monthToGenerate, targetYear).subscribe({
      next: (payslip: Payslip) => {
        this.generatingPayslip = false;
        console.log(' Fiche test générée avec succès:', payslip);

        if (payslip.seniorityBonus && payslip.seniorityBonus > 0) {
          this.successMessage = ` Fiche de test pour ${this.getMonthName(monthToGenerate)} ${targetYear} générée avec succès! Prime d'ancienneté: ${payslip.seniorityBonus} TND`;
        } else {
          this.successMessage = ` Fiche de test pour ${this.getMonthName(monthToGenerate)} ${targetYear} générée avec succès!`;
        }

        // Recharger l'historique
        setTimeout(() => {
          this.loadPayslipsForYear(this.selectedYear);
        }, 1000);
      },
      error: (error: any) => {
        this.generatingPayslip = false;
        console.error(` Erreur génération fiche test ${monthToGenerate}/${targetYear}:`, error);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  changeLanguage(lang: 'fr' | 'en') {
    this.currentLanguage = lang;
    this.translationService.setLanguage(lang);

    if (this.currentPayslip) {
      this.generatePayslipWithTable();
    }
  }

  downloadPayslip(payslip: Payslip) {
    console.log(' Téléchargement fiche:', payslip.period);

    this.employeeService.downloadHistoricalPayslip(payslip.id).subscribe({
      next: (blob: Blob) => {
        if (blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Fiche_Paie_${payslip.period.replace(' ', '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          this.successMessage = ` Fiche ${payslip.period} téléchargée avec succès`;
        } else {
          this.generateAndDownloadPayslip(payslip);
        }
      },
      error: (error: any) => {
        console.error(' Erreur téléchargement:', error);
        this.generateAndDownloadPayslip(payslip);
      }
    });
  }

  printPayslip(payslip: Payslip) {
    console.log(' Impression fiche:', payslip.period);

    if (this.currentPdfUrl) {
      const pdfWindow = window.open(this.currentPdfUrl.toString(), '_blank');
      if (pdfWindow) {
        setTimeout(() => {
          pdfWindow.print();
        }, 1000);
      }
    } else {
      this.generateAndPrintPayslip(payslip);
    }
  }

  private generateAndDownloadPayslip(payslip: Payslip) {
    try {
      const periodText = payslip.period;
      const doc = this.pdfGenerationService.generatePayslipPDF(
        this.currentEmployee,
        periodText,
        this.currentLanguage
      );

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `Fiche_Paie_${payslip.period.replace(' ', '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.successMessage = ` Fiche ${payslip.period} générée et téléchargée`;
    } catch (error: any) {
      console.error(' Erreur génération PDF:', error);
    }
  }

  private generateAndPrintPayslip(payslip: Payslip) {
    try {
      const periodText = payslip.period;
      const doc = this.pdfGenerationService.generatePayslipPDF(
        this.currentEmployee,
        periodText,
        this.currentLanguage
      );

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }, 1000);
      }
    } catch (error: any) {
      console.error(' Erreur génération PDF impression:', error);
    }
  }

  hasPayslipForMonth(month: number): boolean {
    if (!this.payslipHistory || this.payslipHistory.length === 0) {
      return false;
    }

    const searchMonth = Number(month);
    const searchYear = Number(this.selectedYear);

    const hasPayslip = this.payslipHistory.some(payslip => {
      const payslipMonth = Number(payslip.month);
      const payslipYear = Number(payslip.year);
      return payslipMonth === searchMonth && payslipYear === searchYear;
    });

    return hasPayslip;
  }

  getPayslipsForMonth(month: number): Payslip[] {
    const searchMonth = Number(month);
    const searchYear = Number(this.selectedYear);

    return this.payslipHistory.filter(payslip => {
      const payslipMonth = Number(payslip.month);
      const payslipYear = Number(payslip.year);
      return payslipMonth === searchMonth && payslipYear === searchYear;
    });
  }

  viewPayslip(payslip: Payslip) {
    this.currentPayslip = payslip;
    this.payslipLoading = true;
    this.showPayslipModal = true;

    console.log(' Visualisation fiche:', payslip.period);
    this.generatePayslipWithTable();
  }

  generatePayslipWithTable() {
    if (!this.currentEmployee) {
      this.errorMessage = 'Informations employé non chargées';
      this.payslipLoading = false;
      return;
    }

    try {
      let periodText: string;
      if (this.currentPayslip && this.currentPayslip.period) {
        periodText = this.currentPayslip.period;
      } else if (this.currentPayslip && this.currentPayslip.month && this.currentPayslip.year) {
        const monthName = this.getMonthName(this.currentPayslip.month);
        periodText = `${monthName} ${this.currentPayslip.year}`;
      } else {
        const monthName = this.getMonthName(new Date().getMonth() + 1);
        periodText = `${monthName} ${this.currentYear}`;
      }

      const doc = this.pdfGenerationService.generatePayslipPDF(
        this.currentEmployee,
        periodText,
        this.currentLanguage
      );

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
      this.payslipLoading = false;

    } catch (error: any) {
      console.error('Erreur génération fiche de paie:', error);
      this.errorMessage = 'Erreur lors de la génération de la fiche de paie';
      this.payslipLoading = false;
      this.showPayslipModal = false;
      this.cdr.detectChanges();
    }
  }

  closePayslipModal() {
    this.showPayslipModal = false;
    this.currentPayslip = null;
    if (this.currentPdfUrl) {
      URL.revokeObjectURL(this.currentPdfUrl.toString());
      this.currentPdfUrl = null;
    }
  }

  getMonthName(month: number): string {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    ;

    return monthNames[month - 1] || '';
  }

  getCurrentMonthName(): string {
    const currentMonth = new Date().getMonth() + 1;
    return this.getMonthName(currentMonth);
  }

  calculateSeniorityYears(): string {
    if (!this.currentEmployee?.hireDate) return 'Non définie';
    const hireDate = new Date(this.currentEmployee.hireDate);
    return this.calculationsService.calculateSeniorityYears(hireDate);
  }

  getQuarters() {
    return [
      { name: '1st Quarter', months: [1, 2, 3] },
      { name: '2nd Quarter', months: [4, 5, 6] },
      { name: '3rd Quarter', months: [7, 8, 9] },
      { name: '4th Quarter', months: [10, 11, 12] }

    ];
  }

  isMonthAvailableForGeneration(year: number, month: number): boolean {
    if (!this.currentEmployee?.hireDate) {
      return true;
    }

    const hireDate = new Date(this.currentEmployee.hireDate);
    const hireYear = hireDate.getFullYear();
    const hireMonth = hireDate.getMonth() + 1;

    if (year > hireYear) {
      return true;
    }

    if (year === hireYear && month >= hireMonth) {
      return true;
    }

    return false;
  }

  isMonthInFuture(year: number, month: number): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    console.log(`Vérification mois ${month}/${year} - Actuel: ${currentMonth}/${currentYear}`);

    if (year > currentYear) {
      console.log(` ${month}/${year} est dans le futur (année future)`);
      return true;
    }

    if (year === currentYear && month > currentMonth) {
      console.log(` ${month}/${year} est dans le futur (mois futur)`);
      return true;
    }

    console.log(` ${month}/${year} peut être généré`);
    return false;
  }

  canGenerateForMonth(month: number): boolean {
    // Vérifier les permissions d'abord
    if (!this.canUserGeneratePayslips()) {
      return false;
    }

    console.log(` Vérification génération pour ${month}/${this.selectedYear}`);

    if (this.isMonthInFuture(this.selectedYear, month)) {
      return false;
    }

    if (!this.isMonthAvailableForGeneration(this.selectedYear, month)) {
      return false;
    }

    const hasPayslip = this.hasPayslipForMonth(month);
    if (hasPayslip) {
      return false;
    }

    return !this.generatingPayslip;
  }

  generatePayslipForMonth(month: number) {
    // Vérifier les permissions
    if (!this.canUserGeneratePayslips()) {
      this.errorMessage = ' Vous n\'avez pas les permissions pour générer des fiches de paie';
      return;
    }

    if (this.isMonthInFuture(this.selectedYear, month)) {
      return;
    }

    if (!this.canGenerateForMonth(month)) {
      return;
    }

    this.generatingPayslip = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log(` Génération fiche pour ${month}/${this.selectedYear} - Employé: ${this.employeeName}`);

    this.employeeService.generatePayslipForMonth(this.employeeId, month, this.selectedYear).subscribe({
      next: (newPayslip: Payslip) => {
        this.generatingPayslip = false;
        console.log(' Fiche générée avec succès:', newPayslip);
        this.successMessage = ` Payslip for ${this.getMonthName(month)} ${this.selectedYear} created successfully!`;

        setTimeout(() => {
          this.loadPayslipsForYear(this.selectedYear);
        }, 1000);
      },
      error: (error: any) => {
        this.generatingPayslip = false;
        console.error(' Erreur génération fiche:', error);
        this.cdr.detectChanges();
      }
    });
  }

  // MÉTHODE UNIQUE POUR DÉTERMINER LE MOIS CIBLE
  getTargetMonth(): number {
    if (this.selectedYear < this.currentYear) {
      return 12;
    } else if (this.selectedYear === this.currentYear) {
      return new Date().getMonth() + 1;
    } else {
      return 1;
    }
  }


  //  MÉTHODE UNIQUE POUR LA GÉNÉRATION ANNUELLE
  generatePayslipsForYear(year: number) {
    // Vérifier les permissions
    if (!this.canUserGeneratePayslips()) {
      this.errorMessage = 'You do not have permission to generate payslips';
      return;
    }

    if (!year) {
      return;
    }

    if (year > this.currentYear) {
      return;
    }

    this.generatingPayslip = true;
    this.errorMessage = '';
    this.successMessage = ` Generating payslips for ${year} in progress...`;

    console.log(` Annual generation for  ${year} - Employee: ${this.employeeName}`);

    this.employeeService.generatePayslipsForYear(this.employeeId, year).subscribe({
      next: (result: any) => {
        this.generatingPayslip = false;
        console.log(' Annual generation complete:', result);

        const successCount = result.generatedCount || result.successCount || 0;
        this.successMessage = ` ${successCount} generated successfully for ${year}!`;

        setTimeout(() => {
          this.loadPayslipsForYear(this.selectedYear);
        }, 2000);
      },
      error: (error: any) => {
        this.generatingPayslip = false;
        console.error(' Error generating payslip:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onYearChange() {
    console.log(` Change the year: ${this.selectedYear}`);
    this.loadPayslipsForYear(this.selectedYear);
    this.errorMessage = '';
    this.successMessage = '';
  }

  onPdfLoad() {
    console.log('PDF de fiche de paie chargé avec succès');
  }

  canGenerateForSelectedYear(): boolean {
    // Permettre aux RH de générer, et aux employés de générer leurs propres fiches
    if (this.canUserGeneratePayslips() || this.isViewingOwnProfile) {
      if (this.selectedYear > this.currentYear) {
        return false;
      }

      if (this.selectedYear === this.currentYear) {
        const currentMonth = new Date().getMonth() + 1;
        return !this.isMonthInFuture(this.selectedYear, currentMonth);
      }

      return true;
    }

    return false;
  }

// S'assurer que cette méthode permet aux employés de générer leurs propres fiches
  canUserGeneratePayslips(): boolean {
    // RH peuvent générer toutes les fiches, employés peuvent générer leurs propres fiches
    return this.canGeneratePayslips || this.isViewingOwnProfile;
  }
  checkNineDinarsEligibility(): void {
    if (!this.currentEmployee?.hireDate) return;

    const hireDate = new Date(this.currentEmployee.hireDate);
    const currentDate = new Date();

    const totalMonths = this.calculateExactMonthsOfService(hireDate, currentDate);

    console.log(` Vérification éligibilité prime 9 dinars:`);
    console.log(`   - Date embauche: ${hireDate.toLocaleDateString()}`);
    console.log(`   - Date actuelle: ${currentDate.toLocaleDateString()}`);
    console.log(`   - Mois de service: ${totalMonths}`);
    console.log(`   - Éligible: ${totalMonths >= 18 ? 'OUI' : 'NON'}`);

    if (totalMonths >= 18) {
      const bonusPeriods = Math.floor(totalMonths / 18);
      const nineDinarsBonus = bonusPeriods * 9;
      console.log(`   - Périodes bonus: ${bonusPeriods}`);
      console.log(`   - Prime 9 dinars: ${nineDinarsBonus} TND`);

      for (let i = 1; i <= bonusPeriods; i++) {
        const moisDebut = ((i-1) * 18) + 1;
        const moisFin = i * 18;
        const primeCumulee = i * 9;
        console.log(`     Période ${i}: mois ${moisDebut}-${moisFin} = ${primeCumulee} TND`);
      }
    }
  }

  private calculateExactMonthsOfService(hireDate: Date, currentDate: Date): number {
    const years = currentDate.getFullYear() - hireDate.getFullYear();
    const months = currentDate.getMonth() - hireDate.getMonth();
    let totalMonths = (years * 12) + months;

    if (currentDate.getDate() < hireDate.getDate()) {
      totalMonths--;
    }

    return Math.max(0, totalMonths);
  }
}

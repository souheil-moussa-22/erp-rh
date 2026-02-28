import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeServices, Employee } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
import { AddEmployeeComponent } from '../add-employee/add-employee.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AddEmployeeComponent
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  searchTerm: string = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  filteredEmployees: Employee[] = [];
  showAddModal = false;

  // Permission checking variables
  canAddEmployees = false;
  canViewEmployees = false;

  // Propriété pour l'ID de l'utilisateur connecté
  currentUserId: string | null = null;

  // Cache pour vérifier les rôles des employés
  private employeeRoleCache = new Map<string, boolean>();

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  paginatedEmployees: Employee[] = [];

  private employeeService = inject(EmployeeServices);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.checkPermissions();
    this.loadEmployees();
  }

  // Check user permissions
  private checkPermissions(): void {
    this.canAddEmployees = this.authService.isHRManager(); // Seuls les managers peuvent ajouter
    this.canViewEmployees = this.authService.canViewEmployeeList();
    // Récupérer l'ID de l'utilisateur connecté
    this.currentUserId = this.authService.getCurrentUserId();

    console.log(' EmployeeListComponent - Permissions checked:');
    console.log('   - currentUserId:', this.currentUserId);
    console.log('   - canAddEmployees:', this.canAddEmployees);
    console.log('   - canViewEmployees:', this.canViewEmployees);
    console.log('   - User roles:', this.authService.getUserRoles());
    console.log('   - isHR:', this.authService.isHR());
    console.log('   - isHRManager:', this.authService.isHRManager());

    // If user doesn't have permissions, show message
    if (!this.canViewEmployees) {
      this.errorMessage = ' You do not have permissions to view the employee list.';
      const currentUserId = this.authService.getCurrentUserId();
      if (currentUserId) {
        console.log(' Redirecting to personal profile');
      }
    }
  }

  canModifyEmployees(): boolean {
    // Seuls les HR Managers et Managers peuvent modifier
    return this.authService.isHRManager();
  }

  // Méthode simplifiée pour vérifier si un employé est un HR Manager
  private isHRManagerEmployee(employee: Employee): boolean {
    // Vérifier dans le cache d'abord
    if (employee.id && this.employeeRoleCache.has(employee.id)) {
      return this.employeeRoleCache.get(employee.id)!;
    }

    // Logique basée sur les données disponibles
    // 1. Vérifier le username (selon vos logs)
    if (employee.username && employee.username.toLowerCase().includes('hr manager')) {
      if (employee.id) this.employeeRoleCache.set(employee.id, true);
      return true;
    }

    // 2. Vérifier la position
    if (employee.position) {
      const position = employee.position.toLowerCase();
      const isManager = position.includes('manager') || position.includes('hr manager');
      if (isManager && employee.id) {
        this.employeeRoleCache.set(employee.id, true);
      }
      return isManager;
    }

    // 3. Vérifier les roleNames si disponibles
    if (employee.roleNames && employee.roleNames.length > 0) {
      const isManager = employee.roleNames.some(role =>
        role.toUpperCase().includes('HRMANAGER') ||
        role.toUpperCase().includes('MANAGER')
      );
      if (employee.id) this.employeeRoleCache.set(employee.id, isManager);
      return isManager;
    }

    // Par défaut, ce n'est pas un manager
    if (employee.id) this.employeeRoleCache.set(employee.id, false);
    return false;
  }

  // Load employees
  loadEmployees(): void {
    // CHECK PERMISSIONS BEFORE LOADING
    if (!this.canViewEmployees) {
      this.errorMessage = ' You do not have permissions to view the employee list.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.employeeService.getAllEmployees().subscribe({
      next: (data: Employee[]) => {
        console.log('DEBUG: Employees data received - First employee:', data[0]);
        console.log('DEBUG: Total employees:', data.length);

        // Réinitialiser le cache
        this.employeeRoleCache.clear();

        // Filtrer les employés
        this.employees = this.filterEmployeesBasedOnRole(data);

        this.filteredEmployees = [...this.employees];
        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();

        console.log(' Employees after filtering:', this.employees.length);
        console.log(' Current user is HR (not manager):', this.authService.isHR() && !this.authService.isHRManager());

        // Afficher les employés filtrés pour débogage
        if (this.authService.isHR() && !this.authService.isHRManager()) {
          console.log('HR user can see these employees:', this.employees.map(e => ({
            name: e.username,
            position: e.position,
            id: e.id
          })));
        }
      },
      error: (err) => {
        console.error(" Retrieval error details:", err);

        // GESTION D'ERREUR AMÉLIORÉE
        if (err.status === 200 && err.error && typeof err.error === 'string') {
          // Le serveur retourne du texte au lieu du JSON
          console.error(' Server returned text instead of JSON');
          this.errorMessage = 'Format de réponse incorrect du serveur.';
        } else if (err.status === 401) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          this.authService.logout();
        } else if (err.status === 403) {
          this.errorMessage = 'Accès refusé. Permissions insuffisantes.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur.';
        } else {
          this.errorMessage = 'Unable to retrieve the employee list.';
        }

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Méthode pour filtrer les employés selon le rôle de l'utilisateur
  private filterEmployeesBasedOnRole(allEmployees: Employee[]): Employee[] {
    let filteredEmployees = [...allEmployees];

    // 1. Exclure l'utilisateur connecté
    if (this.currentUserId) {
      const beforeCount = filteredEmployees.length;
      filteredEmployees = filteredEmployees.filter(emp => emp.id !== this.currentUserId);
      console.log(`Excluded current user. Before: ${beforeCount}, After: ${filteredEmployees.length}`);
    }

    // 2. Si l'utilisateur est RH (pas Manager), exclure les RH Managers
    if (this.authService.isHR() && !this.authService.isHRManager()) {
      const beforeCount = filteredEmployees.length;
      filteredEmployees = filteredEmployees.filter(emp => {
        const isHRManager = this.isHRManagerEmployee(emp);
        if (isHRManager) {
          console.log(`Excluding HR Manager: ${emp.username} (Position: ${emp.position})`);
        }
        return !isHRManager;
      });
      console.log(`Excluded HR Managers. Before: ${beforeCount}, After: ${filteredEmployees.length}`);
    }

    return filteredEmployees;
  }

  // Filter employees (recherche)
  filterEmployees(): void {
    if (!this.searchTerm) {
      this.filteredEmployees = [...this.employees];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredEmployees = this.employees.filter(emp =>
        emp.username?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term) ||
        emp.phone?.toLowerCase().includes(term) ||
        emp.status?.toLowerCase().includes(term)
      );
    }

    this.currentPage = 1; // Reset to first page when filtering
    this.updatePagination();
  }

  // Ajouter une méthode pour vérifier si c'est l'utilisateur courant
  isCurrentUser(employeeId: string | undefined): boolean {
    if (!employeeId || !this.currentUserId) return false;
    return employeeId === this.currentUserId;
  }

  // Open add modal
  openAddModal(): void {
    // CHECK PERMISSIONS BEFORE OPENING
    if (!this.canAddEmployees) {
      this.errorMessage = ' You do not have permissions to add employees.';
      console.warn(' Attempt to add employee without permissions');
      return;
    }

    console.log(' Opening add employee modal - Permissions OK');
    this.showAddModal = true;
  }

  // Close add modal
  closeAddModal(): void {
    this.showAddModal = false;
  }

  // Handle successful employee addition
  onEmployeeAdded(): void {
    this.closeAddModal();
    this.loadEmployees();
    this.successMessage = " Employee added successfully!";
    setTimeout(() => this.successMessage = '', 4000);
  }

  // Export Excel
  exportExcel(): void {
    if (!this.canAddEmployees) {
      this.errorMessage = ' You do not have permissions to export.';
      return;
    }

    this.employeeService.exportEmployees().subscribe({
      next: (blob: Blob) => {
        saveAs(blob, `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.successMessage = " Excel export successful!";
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        console.error(" Excel export error:", err);
        this.errorMessage = " Error during Excel export.";
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  // Import Excel
  importExcel(event: any): void {
    if (!this.canAddEmployees) {
      this.errorMessage = ' You do not have permissions to import.';
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.errorMessage = ' Please select an Excel file (.xlsx or .xls)';
      event.target.value = '';
      return;
    }

    this.loading = true;
    this.employeeService.importEmployees(file).subscribe({
      next: (res) => {
        this.loadEmployees();
        this.successMessage = " Import successful!";
        this.loading = false;
        setTimeout(() => this.successMessage = '', 4000);
        event.target.value = '';
      },
      error: (err) => {
        console.error(" Excel import error:", err);
        this.errorMessage = " Error during import.";
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 4000);
        event.target.value = '';
      }
    });
  }

  // Delete employee
  deleteEmployee(id: string | undefined): void {
    if (!id) return;

    if (!this.canAddEmployees) {
      this.errorMessage = ' You do not have permissions to delete employees.';
      return;
    }

    if (!confirm("Are you sure you want to delete this employee? This action is irreversible.")) {
      return;
    }

    this.loading = true;
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e.id !== id);
        this.filteredEmployees = this.filteredEmployees.filter(e => e.id !== id);
        this.updatePagination();
        this.loading = false;
        this.successMessage = " Employee deleted successfully!";
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        console.error(" Deletion error:", err);
        this.loading = false;
        this.errorMessage = " Unable to delete.";
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
  }

  trackByEmployeeId(index: number, emp: Employee): string {
    return emp.id!;
  }

  // New method to get status text
  getStatusText(status: string | undefined): string {
    if (!status) return 'Inactive';

    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'ON_LEAVE': 'On Leave',
      'TERMINATED': 'Terminated'
    };

    return statusMap[status] || status;
  }

  // PAGINATION METHODS
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);

    // Ensure current page is within valid range
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredEmployees.length ? this.filteredEmployees.length : end;
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      if (this.currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      }
    }

    return pages;
  }
}

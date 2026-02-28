import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role, RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-list.html',
  styleUrls: ['./role-list.css']
})
export class RoleListComponent implements OnInit {
  // Data
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];

  // States
  loading = false;
  errorMessage = '';
  searchTerm = '';

  // Modals
  showAddModal = false;
  showEditModal = false;
  showDeleteConfirmation = false;
  showBulkDeleteConfirmation = false;

  // Form data
  newRoleName = '';
  editRoleData: Role = { id: '', roleName: '' };

  // Loading states
  modalLoading = false;
  deleteLoading = false;
  bulkDeleteLoading = false;

  // Error messages
  modalErrorMessage = '';
  deleteError = '';

  // Selection
  selectedRoles: Set<string> = new Set();

  constructor(private roleService: RoleService) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.errorMessage = '';

    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.allRoles = roles;
        this.applySearchFilter();
        this.loading = false;
        this.selectedRoles.clear();
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  // Real-time search functionality
  onSearchChange(): void {
    this.applySearchFilter();
  }

  applySearchFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRoles = [...this.allRoles];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredRoles = this.allRoles.filter(role =>
        role.roleName.toLowerCase().includes(searchLower)
      );
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearchFilter();
  }

  // Modal methods
  openAddModal(): void {
    this.showAddModal = true;
    this.newRoleName = '';
    this.modalErrorMessage = '';
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newRoleName = '';
    this.modalErrorMessage = '';
  }

  createRole(): void {
    if (!this.validateRoleName(this.newRoleName)) return;

    this.modalLoading = true;
    this.modalErrorMessage = '';

    const tempRole: Role = {
      id: 'temp-' + Date.now(),
      roleName: this.newRoleName
    };

    this.allRoles.unshift(tempRole);
    this.applySearchFilter();

    this.roleService.createRole(this.newRoleName).subscribe({
      next: (response) => {
        this.modalLoading = false;
        this.closeAddModal();

        // Replace temporary role with actual response
        const index = this.allRoles.findIndex(r => r.id === tempRole.id);
        if (index !== -1) {
          this.allRoles[index] = response;
        }
        this.applySearchFilter();
      },
      error: (error) => {
        this.modalLoading = false;
        this.modalErrorMessage = error.message;

        // Remove temporary role on error
        this.allRoles = this.allRoles.filter(r => r.id !== tempRole.id);
        this.applySearchFilter();
      }
    });
  }

  openEditModal(role: Role): void {
    this.showEditModal = true;
    this.editRoleData = { ...role };
    this.modalErrorMessage = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editRoleData = { id: '', roleName: '' };
    this.modalErrorMessage = '';
  }

  updateRole(): void {
    if (!this.validateRoleName(this.editRoleData.roleName)) return;

    this.modalLoading = true;
    this.modalErrorMessage = '';

    this.roleService.updateRole(this.editRoleData.id, this.editRoleData.roleName).subscribe({
      next: (response) => {
        this.modalLoading = false;
        this.closeEditModal();

        // Update role in the list
        const index = this.allRoles.findIndex(r => r.id === this.editRoleData.id);
        if (index !== -1) {
          this.allRoles[index] = response;
        }
        this.applySearchFilter();
      },
      error: (error) => {
        this.modalLoading = false;
        this.modalErrorMessage = error.message;
      }
    });
  }

  // Delete methods
  openDeleteConfirmation(role: Role): void {
    this.showDeleteConfirmation = true;
    this.editRoleData = { ...role };
    this.deleteError = '';
  }

  closeDeleteConfirmation(): void {
    if (!this.deleteLoading) {
      this.showDeleteConfirmation = false;
      this.editRoleData = { id: '', roleName: '' };
      this.deleteError = '';
    }
  }

  confirmDelete(): void {
    if (!this.editRoleData.id) return;

    this.deleteLoading = true;
    this.deleteError = '';

    this.roleService.deleteRole(this.editRoleData.id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.showDeleteConfirmation = false;

        // Remove from lists
        this.allRoles = this.allRoles.filter(r => r.id !== this.editRoleData.id);
        this.applySearchFilter();
        this.editRoleData = { id: '', roleName: '' };
      },
      error: (error) => {
        this.deleteLoading = false;
        this.deleteError = error.message;
      }
    });
  }

  // Selection methods
  toggleRoleSelection(roleId: string): void {
    if (this.selectedRoles.has(roleId)) {
      this.selectedRoles.delete(roleId);
    } else {
      this.selectedRoles.add(roleId);
    }
  }

  toggleSelectAll(): void {
    if (this.selectedRoles.size === this.filteredRoles.length) {
      this.selectedRoles.clear();
    } else {
      this.filteredRoles.forEach(role => this.selectedRoles.add(role.id));
    }
  }

  openBulkDeleteConfirmation(): void {
    if (this.selectedRoles.size > 0) {
      this.showBulkDeleteConfirmation = true;
      this.deleteError = '';
    }
  }

  closeBulkDeleteConfirmation(): void {
    if (!this.bulkDeleteLoading) {
      this.showBulkDeleteConfirmation = false;
      this.deleteError = '';
    }
  }

  confirmBulkDelete(): void {
    this.bulkDeleteLoading = true;
    this.deleteError = '';

    const deletePromises = Array.from(this.selectedRoles).map(roleId =>
      this.roleService.deleteRole(roleId).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.bulkDeleteLoading = false;
        this.showBulkDeleteConfirmation = false;
        this.loadRoles(); // Reload to refresh both lists
      })
      .catch((error) => {
        this.bulkDeleteLoading = false;
        this.deleteError = error.message;
      });
  }

  // Validation
  private validateRoleName(roleName: string): boolean {
    if (!roleName.trim()) {
      this.modalErrorMessage = 'Role name is required';
      return false;
    }

    if (!roleName.startsWith('ROLE_')) {
      this.modalErrorMessage = 'Role name must start with "ROLE_"';
      return false;
    }

    if (!/^ROLE_[A-Z_]+$/.test(roleName)) {
      this.modalErrorMessage = 'Name must contain only uppercase letters and underscores';
      return false;
    }

    return true;
  }

  // Utility methods
  getSelectedCount(): number {
    return this.selectedRoles.size;
  }

  isAllSelected(): boolean {
    return this.filteredRoles.length > 0 && this.selectedRoles.size === this.filteredRoles.length;
  }

  isIndeterminate(): boolean {
    return this.selectedRoles.size > 0 && this.selectedRoles.size < this.filteredRoles.length;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  clearModalError(): void {
    this.modalErrorMessage = '';
  }

  clearDeleteError(): void {
    this.deleteError = '';
  }
}

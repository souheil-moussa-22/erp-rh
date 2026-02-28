import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CongeService, Conge } from '../../services/conge.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-manage-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-requests.html',
  styleUrls: ['./manage-requests.css']
})
export class ManageRequestsComponent implements OnInit {
  allRequests: Conge[] = [];
  filteredRequests: Conge[] = [];
  displayedRequests: Conge[] = [];
  isLoading = false;
  errorMessage = '';

  filter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  searchText = '';
  sortBy: 'date-desc' | 'date-asc' | 'employee' | 'duration' = 'date-desc';

  showApproveModal = false;
  showRejectModal = false;
  selectedRequest: Conge | null = null;
  rejectionReason = '';
  showReasonError = false;
  isProcessing = false;

  currentUser: User | null = null;
  isRHUser = false;
  isManagerUser = false;

  constructor(
    private congeService: CongeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.getUser();

    if (!this.currentUser) {
      alert('Access denied. Please login.');
      this.router.navigate(['/login']);
      return;
    }

    // Check user role
    this.isRHUser = this.authService.isHR();
    this.isManagerUser = this.authService.isHRManager() && !this.isRHUser;

    // Verify permissions
    if (!this.isRHUser && !this.isManagerUser) {
      alert('Access denied. HR or Manager permissions required.');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isManagerUser) {
      // RH sees PENDING requests
      this.congeService.getAllPendingConges().subscribe({
        next: (requests) => {
          this.allRequests = requests;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (this.isRHUser) {
      // Manager sees APPROVED_RH requests
      this.congeService.getManagerPendingConges().subscribe({
        next: (requests) => {
          this.allRequests = requests;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    }
  }

  private handleLoadError(error: any): void {
    this.isLoading = false;
    this.errorMessage = 'Failed to load requests. Please try again.';
    console.error('Error loading requests:', error);
  }

  filterRequests(status: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.filter = status;

    // Load all requests if needed
    if (status !== 'PENDING') {
      this.isLoading = true;
      this.congeService.getAllConges().subscribe({
        next: (requests) => {
          // Filter based on role
          if (this.isManagerUser) {
            this.allRequests = requests.filter(r =>
              r.status === 'PENDING' ||
              r.status === 'APPROVED_MANAGER' ||
              r.status === 'REJECTED_MANAGER'
            );
          } else {
            this.allRequests = requests.filter(r =>
              r.status === 'APPROVED_MANAGER' ||
              r.status === 'APPROVED_RH' ||
              r.status === 'REJECTED_RH'
            );
          }
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    // Filter by status based on role
    if (this.filter === 'all') {
      this.filteredRequests = this.allRequests;
    } else if (this.filter === 'PENDING') {
      // Manager sees PENDING, HR sees APPROVED_RH
      if (this.isManagerUser) {
        this.filteredRequests = this.allRequests.filter(r => r.status === 'PENDING');
      } else {
        this.filteredRequests = this.allRequests.filter(r => r.status === 'APPROVED_MANAGER');
      }
    } else if (this.filter === 'APPROVED') {
      // Manager sees APPROVED_MANAGER, RH sees APPROVED_RH
      if (this.isManagerUser) {
        this.filteredRequests = this.allRequests.filter(r => r.status === 'APPROVED_MANAGER');
      } else {
        this.filteredRequests = this.allRequests.filter(r => r.status === 'APPROVED_RH');
      }
    } else if (this.filter === 'REJECTED') {
      // Manager sees REJECTED_MANAGER, RH sees REJECTED_RH
      if (this.isManagerUser) {
        this.filteredRequests = this.allRequests.filter(r => r.status === 'REJECTED_MANAGER');
      } else {
        this.filteredRequests = this.allRequests.filter(r => r.status === 'REJECTED_RH');
      }
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      this.filteredRequests = this.filteredRequests.filter(r =>
        r.employeeName.toLowerCase().includes(search) ||
        r.employeeId.toLowerCase().includes(search)
      );
    }

    this.applySort();
  }

  applySort(): void {
    this.displayedRequests = [...this.filteredRequests];

    switch (this.sortBy) {
      case 'date-desc':
        this.displayedRequests.sort((a, b) =>
          new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
        );
        break;
      case 'date-asc':
        this.displayedRequests.sort((a, b) =>
          new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
        );
        break;
      case 'employee':
        this.displayedRequests.sort((a, b) =>
          a.employeeName.localeCompare(b.employeeName)
        );
        break;
      case 'duration':
        this.displayedRequests.sort((a, b) => b.duration - a.duration);
        break;
    }
  }

  getTotalCount(): number {
    return this.allRequests.length;
  }

  getCountByStatus(status: string): number {
    if (status === 'PENDING') {
      return this.isManagerUser
        ? this.allRequests.filter(r => r.status === 'PENDING').length
        : this.allRequests.filter(r => r.status === 'APPROVED_MANAGER').length;
    } else if (status === 'APPROVED') {
      return this.isManagerUser
        ? this.allRequests.filter(r => r.status === 'APPROVED_MANAGER').length
        : this.allRequests.filter(r => r.status === 'APPROVED_RH').length;
    } else if (status === 'REJECTED') {
      return this.isManagerUser
        ? this.allRequests.filter(r => r.status === 'REJECTED_MANAGER').length
        : this.allRequests.filter(r => r.status === 'REJECTED_RH').length;
    }
    return 0;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'ANNUAL': '🏖️',
      'SICK': '🤒',
      'UNPAID': '💼',
      'MATERNITY': '👶',
      'PATERNITY': '👨‍👶',
      'EMERGENCY': '🚨'
    };
    return icons[type] || '📋';
  }

  formatType(type: string): string {
    if (!type) return 'Unknown';
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getDisplayStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending RH Review',
      'APPROVED_RH': 'Pending Manager Approval',
      'REJECTED_RH': 'Rejected by RH',
      'APPROVED_MANAGER': 'Approved',
      'REJECTED_MANAGER': 'Rejected by Manager'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'APPROVED_MANAGER') return 'approved';
    if (status === 'REJECTED_RH' || status === 'REJECTED_MANAGER') return 'rejected';
    if (status === 'APPROVED_RH') return 'pending-manager';
    return 'pending';
  }

  canProcessRequest(request: Conge): boolean {
    // RH can process APPROVED_MANAGER requests
    if (this.isRHUser && request.status === 'APPROVED_MANAGER') {
      return true;
    }

    // Manager can process PENDING requests
    if (this.isManagerUser && request.status === 'PENDING') {
      return true;
    }

    return false;
  }

  openApproveModal(request: Conge): void {
    this.selectedRequest = request;
    this.showApproveModal = true;
  }

  openRejectModal(request: Conge): void {
    this.selectedRequest = request;
    this.rejectionReason = '';
    this.showReasonError = false;
    this.showRejectModal = true;
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedRequest = null;
    this.rejectionReason = '';
    this.showReasonError = false;
  }

  confirmApprove(): void {
    if (!this.selectedRequest || !this.currentUser) return;

    // Ensure current user can process this request
    if (!this.canProcessRequest(this.selectedRequest)) {
      alert('You are not authorized to approve this request.');
      return;
    }

    // Determine status based on role
    const status = this.isRHUser ? 'APPROVED_RH' : (this.isManagerUser ? 'APPROVED_MANAGER' : null);
    if (!status) {
      alert('Invalid role for approval.');
      return;
    }

    this.isProcessing = true;

    this.congeService.updateCongeStatus(
      this.selectedRequest.id,
      this.currentUser.id,
      { status }
    ).subscribe({
      next: (updated) => {
        const index = this.allRequests.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          this.allRequests[index] = updated;
        }

        this.applyFilters();
        this.isProcessing = false;
        this.closeModals();
        alert('Leave request approved successfully!');
      },
      error: (error) => {
        this.isProcessing = false;
        alert('Failed to approve request: ' + (error || 'Please try again'));
        console.error('Error:', error);
      }
    });
  }

  confirmReject(): void {
    if (!this.selectedRequest || !this.currentUser) return;

    // Validate rejection reason
    if (!this.rejectionReason.trim()) {
      this.showReasonError = true;
      return;
    }

    // Ensure current user can process this request
    if (!this.canProcessRequest(this.selectedRequest)) {
      alert('You are not authorized to reject this request.');
      return;
    }

    // Determine status based on role
    const status = this.isRHUser ? 'REJECTED_RH' : (this.isManagerUser ? 'REJECTED_MANAGER' : null);
    if (!status) {
      alert('Invalid role for rejection.');
      return;
    }

    this.isProcessing = true;

    this.congeService.updateCongeStatus(
      this.selectedRequest.id,
      this.currentUser.id,
      {
        status,
        rejectionReason: this.rejectionReason
      }
    ).subscribe({
      next: (updated) => {
        const index = this.allRequests.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          this.allRequests[index] = updated;
        }

        this.applyFilters();
        this.isProcessing = false;
        this.closeModals();
        alert('Leave request rejected successfully!');
      },
      error: (error) => {
        this.isProcessing = false;
        alert('Failed to reject request: ' + (error || 'Please try again'));
        console.error('Error:', error);
      }
    });
  }
}

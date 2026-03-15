import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CongeService, Conge } from '../../services/conge.service';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './requests-list.html',
  styleUrls: ['./requests-list.css']
})
export class RequestsListComponent implements OnInit {
  requests: Conge[] = [];
  filteredRequests: Conge[] = [];
  isLoading = false;
  errorMessage = '';
  filter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'all';

  showDeleteModal = false;
  requestToDelete: Conge | null = null;

  constructor(
    private congeService: CongeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadRequests();
  }

  loadRequests(): void {
    const employeeId = this.authService.getCurrentUserId();

    if (!employeeId) {
      this.errorMessage = 'User not authenticated';
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.congeService.getEmployeeConges(employeeId).subscribe({
      next: (requests) => {
        this.requests = requests.sort((a, b) =>
          new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
        );
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load your requests. Please try again.';
        console.error('Error loading requests:', error);
      }
    });
  }

  filterRequests(status: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.filter = status;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.filter === 'all') {
      this.filteredRequests = this.requests;
    } else if (this.filter === 'PENDING') {
      // PENDING includes: PENDING, APPROVED_MANAGER (still awaiting approval)
      this.filteredRequests = this.requests.filter(r =>
        r.status === 'PENDING' || r.status === 'APPROVED_MANAGER'
      );
    } else if (this.filter === 'APPROVED') {
      // Only fully approved by HR
      this.filteredRequests = this.requests.filter(r => r.status === 'APPROVED_RH');
    } else if (this.filter === 'REJECTED') {
      // Both RH and Manager rejections
      this.filteredRequests = this.requests.filter(r =>
        r.status === 'REJECTED_RH' || r.status === 'REJECTED_MANAGER'
      );
    }
  }

  getTotalCount(): number {
    return this.requests.length;
  }

  getCountByStatus(status: string): number {
    if (status === 'PENDING') {
      return this.requests.filter(r =>
        r.status === 'PENDING' || r.status === 'APPROVED_MANAGER'
      ).length;
    } else if (status === 'APPROVED') {
      return this.requests.filter(r => r.status === 'APPROVED_RH').length;
    } else if (status === 'REJECTED') {
      return this.requests.filter(r =>
        r.status === 'REJECTED_RH' || r.status === 'REJECTED_MANAGER'
      ).length;
    }
    return 0;
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

  getDisplayStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending RH Review',
      'APPROVED_MANAGER': 'Approved by Manager - Pending HR',
      'REJECTED_RH': 'Rejected by RH',
      'APPROVED_RH': 'Approved',
      'REJECTED_MANAGER': 'Rejected by Manager'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'APPROVED_RH') return 'approved';
    if (status === 'REJECTED_RH' || status === 'REJECTED_MANAGER') return 'rejected';
    return 'pending';
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

  formatDateTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewDetails(request: Conge): void {
    let details = `Request Details:\n\n`;
    details += `Type: ${this.formatType(request.type)}\n`;
    details += `Status: ${this.getDisplayStatus(request.status)}\n`;
    details += `Duration: ${request.duration} days\n`;
    details += `Period: ${this.formatDate(request.startDate)} to ${this.formatDate(request.endDate)}\n`;
    details += `Reason: ${request.reason}\n`;
    details += `Submitted: ${this.formatDateTime(request.submissionDate)}\n`;

    // RH Response
    if (request.rhResponseDate) {
      details += `\n--- RH Response ---\n`;
      details += `Decision: ${request.status === 'REJECTED_RH' ? 'Rejected' : 'Approved'}\n`;
      details += `By: ${request.rhRespondedBy || 'RH'}\n`;
      details += `Date: ${this.formatDateTime(request.rhResponseDate)}\n`;
      if (request.rhRejectionReason) {
        details += `Reason: ${request.rhRejectionReason}\n`;
      }
    }

    // Manager Response
    if (request.managerResponseDate) {
      details += `\n--- Manager Response ---\n`;
      details += `Decision: ${request.status === 'REJECTED_MANAGER' ? 'Rejected' : 'Approved'}\n`;
      details += `By: ${request.managerRespondedBy || 'Manager'}\n`;
      details += `Date: ${this.formatDateTime(request.managerResponseDate)}\n`;
      if (request.managerRejectionReason) {
        details += `Reason: ${request.managerRejectionReason}\n`;
      }
    }

    alert(details);
  }

  deleteRequest(request: Conge): void {
    // Only PENDING requests can be deleted
    if (request.status !== 'PENDING') {
      alert('Only pending requests can be cancelled.');
      return;
    }

    this.requestToDelete = request;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.requestToDelete = null;
  }

  confirmDelete(): void {
    if (!this.requestToDelete) return;

    const employeeId = this.authService.getCurrentUserId();
    if (!employeeId) return;

    this.congeService.deleteConge(this.requestToDelete.id, employeeId).subscribe({
      next: () => {
        // Remove from list
        this.requests = this.requests.filter(r => r.id !== this.requestToDelete?.id);
        this.applyFilter();
        this.closeDeleteModal();
        alert('Leave request cancelled successfully');
      },
      error: (error) => {
        console.error('Error deleting request:', error);
        alert('Failed to cancel request: ' + (error || 'Please try again'));
        this.closeDeleteModal();
      }
    });
  }

  goToSubmitRequest(): void {
    this.router.navigate(['/conges/submit']);
  }
}

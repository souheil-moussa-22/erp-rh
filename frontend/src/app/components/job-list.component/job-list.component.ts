// src/app/components/job-list.component/job-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JobOfferService, JobOffer } from '../../services/job-offer.service';

@Component({
  selector: 'app-job-list',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.css',
})
export class JobListComponent implements OnInit {
  getStatusIcon(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'fa-check-circle';
      case 'DRAFT': return 'fa-edit';
      case 'CLOSED': return 'fa-lock';
      case 'ARCHIVED': return 'fa-archive';
      case 'EXPIRED': return 'fa-clock';
      default: return 'fa-circle';
    }
  }

  jobOffers: JobOffer[] = [];
  filteredOffers: JobOffer[] = [];
  loading = false;
  searchKeyword = '';
  selectedStatus = 'ALL';
  statuses = ['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'EXPIRED'];

  constructor(private jobService: JobOfferService) { }

  ngOnInit(): void {
    this.loadJobOffers();
  }

  loadJobOffers(): void {
    this.loading = true;
    this.jobService.getAllJobOffers().subscribe({
      next: (offers) => {
        this.jobOffers = offers;
        this.filteredOffers = offers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading job offers:', error);
        this.loading = false;
      }
    });
  }

  searchJobs(): void {
    if (this.searchKeyword.trim()) {
      this.jobService.searchJobOffers(this.searchKeyword).subscribe({
        next: (offers) => {
          this.filteredOffers = offers;
        },
        error: (error) => {
          console.error('Error searching jobs:', error);
        }
      });
    } else {
      this.filteredOffers = this.jobOffers;
    }
    this.filterByStatus();
  }

  filterByStatus(): void {
    if (this.selectedStatus === 'ALL') {
      this.filteredOffers = this.searchKeyword ? this.filteredOffers : this.jobOffers;
    } else {
      this.jobService.getJobOffersByStatus(this.selectedStatus).subscribe({
        next: (offers) => {
          this.filteredOffers = offers;
        },
        error: (error) => {
          console.error('Error filtering by status:', error);
        }
      });
    }
  }

  publishJob(id: string): void {
    this.jobService.publishJobOffer(id).subscribe({
      next: (updatedOffer) => {
        const index = this.jobOffers.findIndex(job => job.id === id);
        if (index !== -1) {
          this.jobOffers[index] = updatedOffer;
        }
        this.filterByStatus();
      },
      error: (error) => {
        console.error('Error publishing job:', error);
      }
    });
  }

  closeJob(id: string): void {
    this.jobService.closeJobOffer(id).subscribe({
      next: (updatedOffer) => {
        const index = this.jobOffers.findIndex(job => job.id === id);
        if (index !== -1) {
          this.jobOffers[index] = updatedOffer;
        }
        this.filterByStatus();
      },
      error: (error) => {
        console.error('Error closing job:', error);
      }
    });
  }

  deleteJob(id: string): void {
    if (confirm('Are you sure you want to delete this job offer?')) {
      this.jobService.deleteJobOffer(id).subscribe({
        next: () => {
          this.jobOffers = this.jobOffers.filter(job => job.id !== id);
          this.filteredOffers = this.filteredOffers.filter(job => job.id !== id);
        },
        error: (error) => {
          console.error('Error deleting job:', error);
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'status-published';
      case 'DRAFT': return 'status-draft';
      case 'CLOSED': return 'status-closed';
      case 'ARCHIVED': return 'status-archived';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-default';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}
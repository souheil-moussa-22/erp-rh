import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormationService, Formation } from '../../services/formation.service';
import { FormsModule } from '@angular/forms';
import { StatCard } from '../statistics-card.component/statistics-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './formation-list.component.html',
  styleUrls: ['./formation-list.component.css']
})
export class FormationListComponent implements OnInit {
  formations: Formation[] = [];
  filteredFormations: Formation[] = [];

  // Statistics
  plannedCount = 0;
  inProgressCount = 0;
  completedCount = 0;
  cancelledCount = 0;
  totalCount = 0;

  // Stats pour le composant séparé
  stats: StatCard[] = [];

  loading = false;
  searchTerm = '';
  selectedStatus = 'ALL';
  selectedCategory = 'ALL';
  selectedSort = 'RECENT';

  statuses = ['ALL', 'PLANIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  categories = ['ALL', 'TECHNICAL', 'SOFT_SKILLS', 'MANAGEMENT', 'COMPLIANCE', 'LANGUAGE'];
  sortOptions = [
    { value: 'RECENT', label: 'Recent' },
    { value: 'TITLE_ASC', label: 'Title A-Z' },
    { value: 'TITLE_DESC', label: 'Title Z-A' },
    { value: 'PARTICIPANTS_DESC', label: 'Most Participants' },
    { value: 'PARTICIPANTS_ASC', label: 'Fewest Participants' },
    { value: 'START_DATE_ASC', label: 'Start Date (Earliest)' },
    { value: 'START_DATE_DESC', label: 'Start Date (Latest)' },
    { value: 'COST_DESC', label: 'Highest Cost' },
    { value: 'COST_ASC', label: 'Lowest Cost' }
  ];

  constructor(private formationService: FormationService) {}

  ngOnInit(): void {
    this.loadFormations();
  }

  loadFormations(): void {
    this.loading = true;
    this.formationService.getAllFormations().subscribe({
      next: (formations) => {
        this.formations = formations;
        this.filteredFormations = formations;
        this.updateStatistics();
        this.applySorting();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading formations:', error);
        this.loading = false;
        alert('Error loading formations. Please try again.');
      }
    });
  }

  updateStatistics(): void {
    this.totalCount = this.formations.length;
    this.plannedCount = this.formations.filter(f => f.status === 'PLANIFIED').length;
    this.inProgressCount = this.formations.filter(f => f.status === 'IN_PROGRESS').length;
    this.completedCount = this.formations.filter(f => f.status === 'COMPLETED').length;
    this.cancelledCount = this.formations.filter(f => f.status === 'CANCELLED').length;

    // Mettre à jour les stats pour le composant
    this.stats = [
      {
        title: 'Total',
        value: this.totalCount,
        icon: 'fas fa-chalkboard',
        color: 'total',
        description: 'Total Trainings'
      },
      {
        title: 'Planned',
        value: this.plannedCount,
        icon: 'fas fa-clock',
        color: 'planned',
        description: 'Planned'
      },
      {
        title: 'In Progress',
        value: this.inProgressCount,
        icon: 'fas fa-play-circle',
        color: 'in-progress',
        description: 'In Progress'
      },
      {
        title: 'Completed',
        value: this.completedCount,
        icon: 'fas fa-check-circle',
        color: 'completed',
        description: 'Completed'
      }
    ];
  }

  // Méthode de recherche
  searchFormations(): void {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.formationService.searchFormations(this.searchTerm).subscribe({
        next: (formations) => {
          this.filteredFormations = formations;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error searching formations:', error);
          this.loading = false;
        }
      });
    } else {
      this.filteredFormations = this.formations;
      this.applyFilters();
    }
  }

  // Méthode d'application des filtres
  applyFilters(): void {
    let filtered = [...this.formations];

    // Appliquer le filtre de statut
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(f => f.status === this.selectedStatus);
    }

    // Appliquer le filtre de catégorie
    if (this.selectedCategory !== 'ALL') {
      filtered = filtered.filter(f => f.category === this.selectedCategory);
    }

    // Appliquer la recherche si elle existe
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower) ||
        (f.skills && f.skills.toLowerCase().includes(searchLower)) ||
        f.formateur.toLowerCase().includes(searchLower) ||
        f.location.toLowerCase().includes(searchLower)
      );
    }

    this.filteredFormations = filtered;
    this.applySorting();
    this.updateStatistics();
  }

  // Méthode de tri
  applySorting(): void {
    const formationsToSort = [...this.filteredFormations];

    switch (this.selectedSort) {
      case 'RECENT':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
        );
        break;

      case 'TITLE_ASC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        break;

      case 'TITLE_DESC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          b.title.localeCompare(a.title)
        );
        break;

      case 'PARTICIPANTS_DESC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          (b.currentParticipants || 0) - (a.currentParticipants || 0)
        );
        break;

      case 'PARTICIPANTS_ASC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          (a.currentParticipants || 0) - (b.currentParticipants || 0)
        );
        break;

      case 'START_DATE_ASC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        break;

      case 'START_DATE_DESC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        break;

      case 'COST_DESC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          (b.cost || 0) - (a.cost || 0)
        );
        break;

      case 'COST_ASC':
        this.filteredFormations = formationsToSort.sort((a, b) =>
          (a.cost || 0) - (b.cost || 0)
        );
        break;

      default:
        // Tri par défaut (récent)
        this.filteredFormations = formationsToSort.sort((a, b) =>
          new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
        );
    }
  }

  // Méthode appelée quand le tri change
  onSortChange(): void {
    this.applySorting();
  }

  // Méthodes pour les actions des cartes
  handleStartFormation(id: string): void {
    if (confirm('Are you sure you want to start this training?')) {
      this.formationService.startFormation(id).subscribe({
        next: () => {
          this.loadFormations();
          alert('Training started successfully!');
        },
        error: (error) => {
          console.error('Error starting training:', error);
          alert('Error starting training: ' + error.message);
        }
      });
    }
  }

  handleCompleteFormation(id: string): void {
    if (confirm('Are you sure you want to complete this training?')) {
      this.formationService.completeFormation(id).subscribe({
        next: () => {
          this.loadFormations();
          alert('Training completed successfully!');
        },
        error: (error) => {
          console.error('Error completing training:', error);
          alert('Error completing training: ' + error.message);
        }
      });
    }
  }

  handleCancelFormation(id: string): void {
    if (confirm('Are you sure you want to cancel this training?')) {
      this.formationService.cancelFormation(id).subscribe({
        next: () => {
          this.loadFormations();
          alert('Training cancelled successfully!');
        },
        error: (error) => {
          console.error('Error cancelling training:', error);
          alert('Error cancelling training: ' + error.message);
        }
      });
    }
  }

  handleDeleteFormation(id: string): void {
    if (confirm('Are you sure you want to delete this training? This action cannot be undone.')) {
      this.formationService.deleteFormation(id).subscribe({
        next: () => {
          this.loadFormations();
          alert('Training deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting training:', error);
          alert('Error deleting training: ' + error.message);
        }
      });
    }
  }

  // Méthodes utilitaires
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PLANIFIED': return 'status-badge planned';
      case 'IN_PROGRESS': return 'status-badge in-progress';
      case 'COMPLETED': return 'status-badge completed';
      case 'CANCELLED': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  }

  getProgressPercentage(formation: Formation): number {
    if (!formation.maxParticipants || formation.maxParticipants === 0) return 0;
    return Math.round((formation.currentParticipants / formation.maxParticipants) * 100);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getSkillsArray(skills: string): string[] {
    if (!skills) return [];
    return skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  }

  // Méthode pour réinitialiser les filtres
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedSort = 'RECENT';
    this.filteredFormations = this.formations;
    this.applySorting();
    this.updateStatistics();
  }
}

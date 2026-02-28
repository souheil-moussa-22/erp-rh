import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Formation } from '../../services/formation.service';

@Component({
  selector: 'app-formation-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './formation-card.component.html',
  styleUrls: ['./formation-card.component.css']
})
export class FormationCardComponent {
  @Input() training!: Formation;
  @Output() startFormation = new EventEmitter<string>();
  @Output() completeFormation = new EventEmitter<string>();
  @Output() cancelFormation = new EventEmitter<string>();
  @Output() deleteFormation = new EventEmitter<string>();

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PLANIFIED': return 'status-badge planned';
      case 'IN_PROGRESS': return 'status-badge in-progress';
      case 'COMPLETED': return 'status-badge completed';
      case 'CANCELLED': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  }

  getProgressPercentage(): number {
    if (!this.training.maxParticipants || this.training.maxParticipants === 0) return 0;
    return Math.round((this.training.currentParticipants / this.training.maxParticipants) * 100);
  }

  getSkillsArray(): string[] {
    if (!this.training.skills) return [];
    return this.training.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onStartFormation(): void {
    this.startFormation.emit(this.training.id);
  }

  onCompleteFormation(): void {
    this.completeFormation.emit(this.training.id);
  }

  onCancelFormation(): void {
    this.cancelFormation.emit(this.training.id);
  }

  onDeleteFormation(): void {
    this.deleteFormation.emit(this.training.id);
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-statistics-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-card.component.html',
  styleUrls: ['./statistics-card.component.css']
})
export class StatisticsCardComponent {
  @Input() stats: StatCard[] = [];
}
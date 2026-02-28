import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';  // Add this for <mat-spinner>
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { LeaveBalanceDTO, LeaveBalanceService } from '../../services/leave-balance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,  // Add this
    MatTableModule,
    MatButtonModule
  ],
  templateUrl: './leave-balance.component.html',
  styleUrls: ['./leave-balance.component.css']
})
export class LeaveBalanceComponent implements OnInit {
  balances: LeaveBalanceDTO[] = [];
  loading = true;
  error = '';
  selectedTab = 0;

  // Récupérer l'ID de l'employé connecté (à adapter selon votre auth)
  employeeId = localStorage.getItem('employeeId') || 'current';

  constructor(
    private leaveBalanceService: LeaveBalanceService,
    private snackBar: MatSnackBar
  ) {}

  //ngOnInit(): void {
    //this.loadLeaveBalances();
 // }
  ngOnInit(): void {
    // Temporarily skip the API and use mock data
    this.balances = [
      { leaveType: 'ANNUAL', leaveLabel: 'Congé Annuel', totalDays: 22, usedDays: 5, remainingDays: 17 },
      { leaveType: 'SICK', leaveLabel: 'Congé Maladie', totalDays: 18, usedDays: 0, remainingDays: 18 },
      { leaveType: 'UNPAID', leaveLabel: 'Congé Sans Solde', totalDays: 15, usedDays: 2, remainingDays: 13 },
      { leaveType: 'MARRIAGE', leaveLabel: 'Congé Mariage', totalDays: 7, usedDays: 0, remainingDays: 7 },
      { leaveType: 'MATERNITY', leaveLabel: 'Congé Maternité', totalDays: 30, usedDays: 0, remainingDays: 30 },
      { leaveType: 'PATERNITY', leaveLabel: 'Congé Paternité', totalDays: 3, usedDays: 0, remainingDays: 3 },
      // Add more as needed
    ];
    this.loading = false;  // Show content immediately
  }


  loadLeaveBalances(): void {
    this.loading = true;
    this.leaveBalanceService.getEmployeeLeaveBalances(this.employeeId).subscribe({
      next: (data) => {
        this.balances = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des soldes de congé';
        this.snackBar.open(this.error, 'Fermer', { duration: 5000 });
        this.loading = false;
        console.error('Error loading leave balances:', err);
      }
    });
  }

  getLeaveIcon(leaveType: string): string {
    const icons: { [key: string]: string } = {
      'ANNUAL': 'event_available',
      'SICK': 'sick',
      'MATERNITY': 'child_care',
      'PATERNITY': 'family_restroom',
      'UNPAID': 'pending_actions',
      'MARRIAGE': 'favorite',
      'TRAINING': 'school',
      'CHILD_MARRIAGE': 'celebration',
      'BIRTH': 'child_friendly',
      'DEATH_SPOUSE': 'person_remove',
      'DEATH_PARENT': 'elderly'
    };
    return icons[leaveType] || 'event_available';
  }

  getStatusColor(remainingDays: number, totalDays: number): string {
    const percentage = (remainingDays / totalDays) * 100;
    if (percentage >= 50) return 'success';
    if (percentage >= 25) return 'warning';
    return 'error';
  }

  formatDays(days: number): string {
    return Number.isInteger(days) ? days.toString() : days.toFixed(1);
  }

  get mainLeaves(): LeaveBalanceDTO[] {
    return this.balances.filter(b =>
      ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID'].includes(b.leaveType)
    );
  }

  get specialLeaves(): LeaveBalanceDTO[] {
    return this.balances.filter(b =>
      ['MARRIAGE', 'CHILD_MARRIAGE', 'BIRTH', 'DEATH_SPOUSE', 'DEATH_PARENT'].includes(b.leaveType)
    );
  }

  get otherLeaves(): LeaveBalanceDTO[] {
    return this.balances.filter(b =>
      !['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID',
        'MARRIAGE', 'CHILD_MARRIAGE', 'BIRTH', 'DEATH_SPOUSE', 'DEATH_PARENT'].includes(b.leaveType)
    );
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTab = event.index;
  }

  refresh(): void {
    this.loadLeaveBalances();
  }

}

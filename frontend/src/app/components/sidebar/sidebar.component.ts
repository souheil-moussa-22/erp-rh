import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    { icon: '🏠', label: 'Tableau de bord', route: '/dashboard', active: true },
    { icon: '👥', label: 'Employés', route: '/employees' },
    { icon: '📅', label: 'Congés', route: '/leaves' },
    { icon: '💰', label: 'Paie', route: '/payroll' },
    { icon: '📊', label: 'Rapports', route: '/reports' },
    { icon: '⚙️', label: 'Paramètres', route: '/settings' }
  ];

  onMenuClick(item: MenuItem): void {
    this.menuItems.forEach(i => i.active = false);
    item.active = true;
    console.log('Navigation vers:', item.route);
  }

  onLogout(): void {
    console.log('Déconnexion');
  }
}

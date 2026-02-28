import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from  './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'HR Management System';
  private authPages = ['/login', '/forgot-password', '/reset-password'];
  private currentUrl = '';

  constructor(private router: Router) {
    // Subscribe to router events to track current URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
    });
  }

  isAuthPage(): boolean {
    return this.authPages.some(page => this.currentUrl.startsWith(page));
  }
}

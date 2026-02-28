import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import type { Notification } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;
  isConnected = false;
  userId = ''; // Get from auth service

  private notificationSubscription?: Subscription;
  private connectionSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;
  private authService = inject(AuthService);

  constructor(
    private webSocketService: WebSocketService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get user ID from authentication service
    this.userId = this.authService.getCurrentUserId() || '';

    if (!this.userId) {
      console.warn('No user ID found for notifications');
      return;
    }
    // Connect to WebSocket
    this.webSocketService.connect(this.userId);
    this.connectionSubscription = this.webSocketService.getConnectionStatus()
        .subscribe(status => {
          this.isConnected = status;
          if (status) {
            // Load after connection
            this.loadNotifications();
          }
        });
    this.notificationSubscription = this.webSocketService.getNotifications()
        .subscribe(notification => {
          if (notification) {
            this.notifications.unshift(notification);
            this.notificationService.incrementUnreadCount();
            this.showBrowserNotification(notification);
            this.playNotificationSound();
          }
        });
    this.unreadCountSubscription = this.notificationService.getUnreadCountObservable()
        .subscribe(count => {
          this.unreadCount = count;
        });
    }


  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();
    this.webSocketService.disconnect();
  }

  loadNotifications(): void {
    this.notificationService.getUserNotifications(this.userId).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });

    // Load unread count
    this.notificationService.getUnreadCount(this.userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.read = true;
        }
      });
    }

    // Navigate based on notification type
    if (notification.type === 'LEAVE_REQUEST') {
      this.router.navigate(['/conges/manage']);
    } else if (notification.type === 'LEAVE_APPROVED' || notification.type === 'LEAVE_REJECTED') {
      this.router.navigate(['/conges/my-requests']);
    }

    this.showNotifications = false;
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
    this.showNotifications = false;
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString();
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/notification-icon.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/assets/notification-icon.png'
          });
        }
      });
    }
  }

  private playNotificationSound(): void {
    const audio = new Audio('/assets/notification-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Could not play sound:', err));
  }
}

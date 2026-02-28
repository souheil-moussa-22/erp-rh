import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Notification } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8081/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  getUserNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`);
  }

  getUnreadNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/unread`)
      .pipe(
        tap(notifications => this.unreadCountSubject.next(notifications.length))
      );
  }

  getUnreadCount(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/unread-count`)
      .pipe(
        tap(count => this.unreadCountSubject.next(count))
      );
  }

  getUnreadCountObservable(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  incrementUnreadCount(): void {
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCountSubject.value;
          if (currentCount > 0) {
            this.unreadCountSubject.next(currentCount - 1);
          }
        })
      );
  }

  markAllAsRead(userId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/user/${userId}/read-all`, {})
      .pipe(
        tap(() => this.unreadCountSubject.next(0))
      );
  }
}

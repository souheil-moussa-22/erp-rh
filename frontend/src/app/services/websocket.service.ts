import { Injectable } from '@angular/core';
import { Client, StompConfig } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  connect(userId: string, userRoles?: string[]): void {

    const endpoint = 'http://localhost:8081/ws-endpoint';

    const stompConfig: StompConfig = {
      webSocketFactory: () => new SockJS(endpoint),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    };

    this.stompClient = new Client(stompConfig);

    this.stompClient.onConnect = () => {
      console.log('Connected via SockJS');
      this.connectionStatusSubject.next(true);

      // USER NOTIFICATIONS
      this.stompClient?.subscribe(`/user/${userId}/queue/notifications`, (msg) => {
        const notif = JSON.parse(msg.body);
        this.notificationSubject.next(notif);
      });

      // ROLE CHECKS
      const isRH = userRoles?.some(r => r.toLowerCase().includes('rh') || r.toLowerCase().includes('role_rh'));
      const isManager = userRoles?.some(r => r.toLowerCase().includes('manager')) && !isRH;

      // RH topic
      if (isRH) {
        this.stompClient?.subscribe('/topic/rh', (msg) => {
          const notif = JSON.parse(msg.body);
          this.notificationSubject.next(notif);
        });
      }

      // Manager topic
      if (isManager) {
        this.stompClient?.subscribe('/topic/managers', (msg) => {
          const notif = JSON.parse(msg.body);
          this.notificationSubject.next(notif);
        });
      }
    };

    this.stompClient.onWebSocketError = (err) =>
      console.error('WebSocket error:', err);

    this.stompClient.activate();
  }

  disconnect(): void {
    this.stompClient?.deactivate();
    this.connectionStatusSubject.next(false);
  }

  getNotifications(): Observable<Notification | null> {
    return this.notificationSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
}

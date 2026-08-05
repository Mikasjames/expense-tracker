import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationMessage {
  id: number;
  message: string;
  type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messagesSubject = new BehaviorSubject<NotificationMessage[]>(
    [],
  );
  readonly messages$ = this.messagesSubject.asObservable();
  private nextId = 0;

  show(message: string, type: NotificationType = 'info', duration = 4000) {
    const notification = { id: ++this.nextId, message, type };
    this.messagesSubject.next([...this.messagesSubject.value, notification]);
    setTimeout(() => this.dismiss(notification.id), duration);
  }

  dismiss(id: number) {
    this.messagesSubject.next(
      this.messagesSubject.value.filter((message) => message.id !== id),
    );
  }
}

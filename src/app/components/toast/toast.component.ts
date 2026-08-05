import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-toast',
  imports: [AsyncPipe, NgClass],
  templateUrl: './toast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly messages$ = this.notifications.messages$;

  constructor(private readonly notifications: NotificationService) {}

  dismiss(id: number) {
    this.notifications.dismiss(id);
  }
}

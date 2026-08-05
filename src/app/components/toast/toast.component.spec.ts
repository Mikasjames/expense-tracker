import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable } from 'rxjs';

import { ToastComponent } from './toast.component';
import { NotificationService } from '../../services/notification/notification.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let messagesSubject: BehaviorSubject<any[]>;
  let notificationStub: {
    messages$: Observable<any[]>;
    dismiss: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    messagesSubject = new BehaviorSubject<Notification[]>([]);
    notificationStub = {
      messages$: messagesSubject.asObservable(),
      dismiss: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: NotificationService, useValue: notificationStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders notifications from the service', () => {
    messagesSubject.next([
      { id: 1, message: 'Saved', type: 'success' },
      { id: 2, message: 'Failed', type: 'error' },
    ]);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Saved');
    expect(html.textContent).toContain('Failed');
    expect(html.querySelectorAll('[role="status"]').length).toBe(2);
  });

  it('dismiss delegates to the notification service', () => {
    component.dismiss(42);
    expect(notificationStub.dismiss).toHaveBeenCalledWith(42);
  });
});

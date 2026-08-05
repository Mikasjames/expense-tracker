import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NotificationMessage } from './notification.service';

import { NotificationService } from './notification.service';

function currentMessages(service: NotificationService): NotificationMessage[] {
  let messages: NotificationMessage[] = [];
  service.messages$.subscribe((m) => (messages = m)).unsubscribe();
  return messages;
}

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shows a notification with default type info and increments ids', () => {
    service.show('First message');
    service.show('Second message', 'success');

    expect(currentMessages(service)).toEqual([
      { id: 1, message: 'First message', type: 'info' },
      { id: 2, message: 'Second message', type: 'success' },
    ]);
  });

  it('supports the error notification type', () => {
    service.show('Uh oh', 'error', 100);

    expect(currentMessages(service)).toEqual([
      { id: 1, message: 'Uh oh', type: 'error' },
    ]);
  });

  it('auto-dismisses a notification after the given duration', () => {
    service.show('Temp', 'info', 4000);
    expect(currentMessages(service)).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(currentMessages(service)).toHaveLength(0);
  });

  it('dismisses a notification by id', () => {
    service.show('Keep me', 'info', 10000);
    service.show('Remove me', 'info', 10000);

    service.dismiss(2);

    expect(currentMessages(service)).toEqual([
      { id: 1, message: 'Keep me', type: 'info' },
    ]);
  });

  it('does not dismiss unrelated ids', () => {
    service.show('Only one', 'info', 10000);

    service.dismiss(99);

    expect(currentMessages(service)).toHaveLength(1);
  });
});

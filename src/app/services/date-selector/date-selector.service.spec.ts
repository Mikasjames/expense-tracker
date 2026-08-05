import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { DateSelectorService } from './date-selector.service';

function currentRange(
  service: DateSelectorService,
): { from: Date; to: Date } | null | undefined {
  let range: { from: Date; to: Date } | null | undefined;
  service.dateRange$.subscribe((value) => (range = value)).unsubscribe();
  return range;
}

describe('DateSelectorService', () => {
  let service: DateSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with a null date range', () => {
    expect(currentRange(service)).toBeNull();
  });

  it('sets a date range', () => {
    const range = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) };
    service.setDateRange(range);

    expect(currentRange(service)).toEqual(range);
  });

  it('exposes the date range through getDateRange', () => {
    const range = { from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) };
    service.setDateRange(range);

    let received: { from: Date; to: Date } | null | undefined;
    service.getDateRange().subscribe((value) => (received = value));

    expect(received).toEqual(range);
  });

  it('clears the date range', () => {
    service.setDateRange({ from: new Date(), to: new Date() });
    service.clearDateRange();

    expect(currentRange(service)).toBeNull();
  });
});

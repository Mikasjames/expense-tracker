import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable } from 'rxjs';

import { DateSelectorComponent } from './date-selector.component';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';

describe('DateSelectorComponent', () => {
  let component: DateSelectorComponent;
  let fixture: ComponentFixture<DateSelectorComponent>;
  let dateRangeSubject: BehaviorSubject<{ from: Date; to: Date } | null>;
  let serviceStub: {
    dateRange$: Observable<{ from: Date; to: Date } | null>;
    setDateRange: ReturnType<typeof vi.fn>;
    clearDateRange: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dateRangeSubject = new BehaviorSubject<{ from: Date; to: Date } | null>(null);
    serviceStub = {
      dateRange$: dateRangeSubject.asObservable(),
      setDateRange: vi.fn(),
      clearDateRange: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [DateSelectorComponent],
      providers: [{ provide: DateSelectorService, useValue: serviceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(DateSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates start and end date when the service emits a range', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    dateRangeSubject.next({ from, to });
    expect(component.startDate()).toEqual(from);
    expect(component.endDate()).toEqual(to);
  });

  it('clears signals when the service emits null', () => {
    component.startDate.set(new Date(2024, 0, 1));
    component.endDate.set(new Date(2024, 0, 31));
    dateRangeSubject.next(null);
    expect(component.startDate()).toBeUndefined();
    expect(component.endDate()).toBeUndefined();
  });

  it('emits range when both start and end are set via start change', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    component.endDate.set(to);
    component.onStartDateChange(from);
    expect(component.startDate()).toEqual(from);
    expect(serviceStub.setDateRange).toHaveBeenCalledWith({ from, to });
  });

  it('does not emit when end date is missing on start change', () => {
    component.onStartDateChange(new Date(2024, 0, 1));
    expect(serviceStub.setDateRange).not.toHaveBeenCalled();
  });

  it('emits range when both start and end are set via end change', () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    component.startDate.set(from);
    component.onEndDateChange(to);
    expect(component.endDate()).toEqual(to);
    expect(serviceStub.setDateRange).toHaveBeenCalledWith({ from, to });
  });

  it.each(['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'] as const)(
    'selectRange handles %s and emits a range',
    (range) => {
      component.selectRange(range);
      expect(component.startDate()).toBeDefined();
      expect(component.endDate()).toBeDefined();
      expect(serviceStub.setDateRange).toHaveBeenCalled();
    },
  );

  it('selectRange clear clears the range', () => {
    component.selectRange('clear');
    expect(serviceStub.clearDateRange).toHaveBeenCalled();
    expect(component.startDate()).toBeUndefined();
  });

  it('selectRange unknown does nothing', () => {
    component.selectRange('nonsense' as never);
    expect(serviceStub.setDateRange).not.toHaveBeenCalled();
    expect(component.startDate()).toBeUndefined();
  });

  it('clearDateRange resets signals and clears the service', () => {
    component.startDate.set(new Date(2024, 0, 1));
    component.endDate.set(new Date(2024, 0, 31));
    component.clearDateRange();
    expect(component.startDate()).toBeUndefined();
    expect(component.endDate()).toBeUndefined();
    expect(serviceStub.clearDateRange).toHaveBeenCalled();
  });

  it('getStartOfWeek returns the Monday of the week', () => {
    const wednesday = new Date(2024, 0, 17);
    const monday = component.getStartOfWeek(wednesday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(15);
  });

  it('getStartOfWeek handles Sunday as end of week', () => {
    const sunday = new Date(2024, 0, 21);
    const monday = component.getStartOfWeek(sunday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(15);
  });
});

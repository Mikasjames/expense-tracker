import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable } from 'rxjs';

import { DashboardPageComponent } from './dashboard-page.component';
import { DateSelectorComponent } from '../../components/date-selector/date-selector.component';
import { AuthService } from '../../services/auth/auth.service';
import { TransactionService } from '../../services/transactions/transaction.service';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { UtilService } from '../../services/util/util.service';
import { TagService } from '../../services/tags/tag.service';
import { SettingsService } from '../../services/settings/settings.service';
import { Transaction } from '../../models/transaction.interface';
import {
  createAuthServiceStub,
  createTransactionServiceStub,
  createHlmDialogServiceStub,
  createUtilServiceStub,
  createTagServiceStub,
  createSettingsServiceStub,
} from '../../testing/service-stubs';

const income: Transaction[] = [
  {
    id: 'i1',
    userId: 'u1',
    title: 'Pay',
    amount: 100,
    type: 'income',
    description: '',
    date: new Date(2024, 0, 10),
    tagIds: ['t1'],
  },
  {
    id: 'i2',
    userId: 'u1',
    title: 'Bonus',
    amount: 50,
    type: 'income',
    description: '',
    date: new Date(2024, 0, 5),
    tagIds: ['t1'],
  },
];

const expenses: Transaction[] = [
  {
    id: 'e1',
    userId: 'u1',
    title: 'Food',
    amount: 30,
    type: 'expense',
    description: '',
    date: new Date(2024, 0, 8),
    tagIds: ['t2'],
  },
  {
    id: 'e2',
    userId: 'u1',
    title: 'Bus',
    amount: 20,
    type: 'expense',
    description: '',
    date: new Date(2024, 0, 3),
    tagIds: ['t2'],
  },
];

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let transactionStub: ReturnType<typeof createTransactionServiceStub>;
  let dateRangeSubject: BehaviorSubject<{ from: Date; to: Date } | null>;
  let dateSelectorStub: { dateRange$: Observable<{ from: Date; to: Date } | null> };
  let dialogStub: ReturnType<typeof createHlmDialogServiceStub>;

  beforeEach(async () => {
    transactionStub = createTransactionServiceStub();
    dateRangeSubject = new BehaviorSubject<{ from: Date; to: Date } | null>(null);
    dateSelectorStub = { dateRange$: dateRangeSubject.asObservable() };
    dialogStub = createHlmDialogServiceStub();
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: AuthService, useValue: createAuthServiceStub() },
        { provide: TransactionService, useValue: transactionStub },
        { provide: DateSelectorService, useValue: dateSelectorStub },
        { provide: HlmDialogService, useValue: dialogStub },
        { provide: UtilService, useValue: createUtilServiceStub() },
        { provide: TagService, useValue: createTagServiceStub() },
        { provide: SettingsService, useValue: createSettingsServiceStub() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with zeroed stats when there are no transactions', () => {
    expect(component.isLoading).toBe(false);
    expect(component.statCards.every((card) => card.value === 0)).toBe(true);
    expect(component.allTransactions).toEqual([]);
  });

  it('computes stats from transactions', () => {
    transactionStub._income.next(income);
    transactionStub._expense.next(expenses);
    const [inCard, outCard, onHand] = component.statCards;
    expect(inCard.value).toBe(150);
    expect(inCard.percentChange).toBe(-50);
    expect(outCard.value).toBe(50);
    expect(outCard.percentChange).toBeCloseTo(-33.33, 1);
    expect(onHand.value).toBe(100);
    expect(onHand.percentChange).toBeCloseTo(42.857, 2);
  });

  it('builds line bar data', () => {
    transactionStub._income.next(income);
    expect(component.incomeLineBarData).toHaveLength(2);
    expect(component.incomeLineBarData[0]).toEqual({
      tag: 't1',
      value: [new Date(2024, 0, 10).getTime(), 100],
      title: 'Pay',
    });
  });

  it('combines and sorts transactions by date descending', () => {
    transactionStub._income.next(income);
    transactionStub._expense.next(expenses);
    expect(component.allTransactions.map((t) => t.id)).toEqual([
      'i1',
      'e1',
      'i2',
      'e2',
    ]);
  });

  it('filters transactions by the selected date range', () => {
    transactionStub._income.next(income);
    transactionStub._expense.next(expenses);
    dateRangeSubject.next({ from: new Date(2024, 0, 6), to: new Date(2024, 0, 20) });
    expect(component.statCards[0].value).toBe(100);
    expect(component.statCards[1].value).toBe(30);
  });

  it('handles an empty date range', () => {
    transactionStub._income.next(income);
    transactionStub._expense.next(expenses);
    dateRangeSubject.next(null);
    expect(component.statCards[0].value).toBe(150);
  });

  it('handles percent change when previous is zero', () => {
    transactionStub._income.next([{ ...income[0], amount: 10 }]);
    transactionStub._expense.next([]);
    expect(component.statCards[2].percentChange).toBe(0);
  });

  it('opens the date selector dialog', () => {
    component.openDateSelector();
    expect(dialogStub.open).toHaveBeenCalledWith(DateSelectorComponent, {
      contentClass: 'sm:max-w-2xl',
    });
  });

  it('completes the destroy subject on destroy', () => {
    const next = vi.spyOn(component['destroy$'] as any, 'next');
    component.ngOnDestroy();
    expect(next).toHaveBeenCalled();
  });

  it('logs an error when a transaction stream fails', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    transactionStub._income.error(new Error('boom'));
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching transactions:',
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});

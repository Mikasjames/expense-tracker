const firestoreMocks = vi.hoisted(() => {
  class FakeTimestamp {
    private readonly date: Date;
    constructor(date: Date) {
      this.date = date;
    }
    static fromDate(d: Date): FakeTimestamp {
      return new FakeTimestamp(d);
    }
    toDate(): Date {
      return this.date;
    }
  }
  return {
    addDoc: vi.fn(() => Promise.resolve({ id: 'new' })),
    collection: vi.fn(() => ({ collection: true })),
    deleteDoc: vi.fn(() => Promise.resolve()),
    doc: vi.fn(() => ({ ref: 'doc' })),
    orderBy: vi.fn(() => ({ order: true })),
    query: vi.fn(() => ({ query: true })),
    updateDoc: vi.fn(() => Promise.resolve()),
    Timestamp: FakeTimestamp,
  };
});

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: firestoreMocks.doc,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  updateDoc: firestoreMocks.updateDoc,
  Timestamp: firestoreMocks.Timestamp,
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, throwError } from 'rxjs';

import { TransactionService } from './transaction.service';
import { FIRESTORE, FirebaseService } from '../firebase/firebase.service';
import {
  createFirebaseServiceStub,
  FirebaseServiceStub,
} from '../../testing/service-stubs';
import { Transaction, TransactionForm } from '../../models/transaction.interface';

function latest<T>(observable: Observable<T>): T {
  let value: T | undefined;
  observable.subscribe((v) => (value = v)).unsubscribe();
  return value as T;
}

function tx(partial: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    userId: 'u1',
    title: 'Title',
    amount: 100,
    type: 'income',
    description: '',
    date: new Date(2026, 0, 1),
    tagIds: [],
    ...partial,
  };
}

describe('TransactionService', () => {
  let service: TransactionService;
  let fb: FirebaseServiceStub;

  beforeEach(() => {
    Object.values(firestoreMocks).forEach((fn) => {
      const mock = fn as { mockClear?: () => void };
      if (typeof mock.mockClear === 'function') mock.mockClear();
    });
    fb = createFirebaseServiceStub();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: {} },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('loads transactions when a user signs in', () => {
      const data = [tx({ id: 'a' }), tx({ id: 'b' })];
      (fb._collectionData as { next: (v: unknown) => void }).next(data);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      expect(service.userId).toBe('u1');
      expect(latest(service.incomeTransactions$)).toEqual(data);
      expect(latest(service.expenseTransactions$)).toEqual(data);
    });

    it('clears transactions when signed out', () => {
      (fb._collectionData as { next: (v: unknown) => void }).next([
        tx({ id: 'a' }),
      ]);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      (fb._authState as { next: (v: unknown) => void }).next(null);

      expect(service.userId).toBeNull();
      expect(latest(service.incomeTransactions$)).toEqual([]);
      expect(latest(service.expenseTransactions$)).toEqual([]);
    });

    it('logs an error when fetching transactions fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      (fb as unknown as { collectionData$: (ref: unknown, id?: string) => ReturnType<typeof throwError> }).collectionData$ = () =>
        throwError(() => new Error('boom'));

      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getTransactionFromId', () => {
    it('finds a transaction in the matching subject', () => {
      const data = [tx({ id: 'x', type: 'income' })];
      (fb._collectionData as { next: (v: unknown) => void }).next(data);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      expect(service.getTransactionFromId('x', 'income')).toEqual(
        expect.objectContaining({ id: 'x' }),
      );
    });

    it('returns undefined when the transaction is missing', () => {
      expect(service.getTransactionFromId('missing', 'income')).toBeUndefined();
      expect(service.getTransactionFromId('missing', 'expense')).toBeUndefined();
    });
  });

  describe('getTransactions', () => {
    it('returns an empty observable when signed out', () => {
      let received: Transaction[] | undefined;
      service.getTransactions('income').subscribe((t) => (received = t));
      expect(received).toEqual([]);
    });

    it('converts timestamps to dates', () => {
      const firestoreDate = new firestoreMocks.Timestamp(new Date(2026, 2, 3));
      (fb._collectionData as { next: (v: unknown) => void }).next([
        { id: 'a', date: firestoreDate },
      ]);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let received: any[] | undefined;
      service.getTransactions('income').subscribe((t) => (received = t));

      expect(received![0].date).toBeInstanceOf(Date);
      expect(received![0].date).toEqual(new Date(2026, 2, 3));
      expect(firestoreMocks.orderBy).toHaveBeenCalledWith('date');
    });

    it('keeps native dates unchanged', () => {
      const plainDate = new Date(2026, 4, 5);
      (fb._collectionData as { next: (v: unknown) => void }).next([
        { id: 'b', date: plainDate },
      ]);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let received: any[] | undefined;
      service.getTransactions('income').subscribe((t) => (received = t));

      expect(received![0].date).toEqual(plainDate);
    });
  });

  describe('getAllTransactions', () => {
    it('returns empty buckets when signed out', () => {
      let received: { incomeTransactions: Transaction[]; expenseTransactions: Transaction[] } | undefined;
      service.getAllTransactions().subscribe((t) => (received = t));
      expect(received).toEqual({ incomeTransactions: [], expenseTransactions: [] });
    });

    it('combines income and expense transactions', () => {
      (fb._collectionData as { next: (v: unknown) => void }).next([
        tx({ id: 'a' }),
      ]);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let received: { incomeTransactions: Transaction[]; expenseTransactions: Transaction[] } | undefined;
      service.getAllTransactions().subscribe((t) => (received = t));
      expect(received?.incomeTransactions).toHaveLength(1);
      expect(received?.expenseTransactions).toHaveLength(1);
    });
  });

  describe('addTransaction', () => {
    it('adds a transaction document', () => {
      const form: TransactionForm = {
        title: 'New',
        amount: 50,
        type: 'expense',
        description: '',
        date: new Date(2026, 0, 1),
        tagIds: [],
      };
      let emitted: unknown;
      service.addTransaction(form).subscribe((p) => (emitted = p));

      expect(firestoreMocks.collection).toHaveBeenCalledWith(
        {},
        'transactions/null/expense',
      );
      expect(firestoreMocks.addDoc).toHaveBeenCalled();
      expect(emitted).toBeInstanceOf(Promise);
    });
  });

  describe('updateTransaction', () => {
    it('updates the transaction with a timestamped date', () => {
      const form: TransactionForm = {
        title: 'Updated',
        amount: 75,
        type: 'income',
        description: '',
        date: new Date(2026, 5, 6),
        tagIds: [],
      };
      service.updateTransaction('t1', form).subscribe();

      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
      const args = firestoreMocks.updateDoc.mock.calls[0] as unknown as [unknown, any];
      expect(args[0]).toEqual({ ref: 'doc' });
      expect(args[1].date).toBeInstanceOf(firestoreMocks.Timestamp);
      expect(args[1].date.toDate()).toEqual(new Date(2026, 5, 6));
    });
  });

  describe('deleteTransaction', () => {
    it('deletes the transaction document', () => {
      service.deleteTransaction(tx({ id: 't1', type: 'expense' })).subscribe();

      expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ ref: 'doc' });
    });
  });
});

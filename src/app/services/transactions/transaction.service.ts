import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  Transaction,
  TransactionForm,
} from '../../models/transaction.interface';
import {
  addDoc,
  collection,
  collectionData,
  Firestore,
} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  userId: string | null = null;
  private incomeTransactionsSubject = new BehaviorSubject<Transaction[]>([]);
  incomeTransactions$ = this.incomeTransactionsSubject.asObservable();
  private expenseTransactionsSubject = new BehaviorSubject<Transaction[]>([]);
  expenseTransactions$ = this.expenseTransactionsSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private fs: Firestore,
  ) {
    this.afAuth.authState
      .pipe(
        switchMap((user) => {
          if (user) {
            this.userId = user.uid;
            return this.getAllTransactions();
          } else {
            this.userId = null;
            return of({ incomeTransactions: [], expenseTransactions: [] });
          }
        }),
      )
      .subscribe({
        next: ({ incomeTransactions, expenseTransactions }) => {
          this.incomeTransactionsSubject.next(incomeTransactions);
          this.expenseTransactionsSubject.next(expenseTransactions);
        },
        error: (error) => {
          console.error('Error fetching transactions:', error);
        },
      });
  }

  getAllTransactions(): Observable<{
    incomeTransactions: Transaction[];
    expenseTransactions: Transaction[];
  }> {
    if (!this.userId)
      return of({ incomeTransactions: [], expenseTransactions: [] });

    const incomeTransactions$ = this.getIncomeTransactions();
    const expenseTransactions$ = this.getExpenseTransactions();

    return combineLatest([incomeTransactions$, expenseTransactions$]).pipe(
      map(([incomeTransactions, expenseTransactions]) => ({
        incomeTransactions,
        expenseTransactions,
      })),
    );
  }

  getTransactions(
    transactionType: 'income' | 'expense',
  ): Observable<Transaction[]> {
    if (!this.userId) return of([]);
    const transactionsCollection = collection(
      this.fs,
      `transactions/${this.userId}/${transactionType}`,
    );
    return collectionData(transactionsCollection, {
      idField: 'id',
    }) as Observable<Transaction[]>;
  }

  getIncomeTransactions(): Observable<Transaction[]> {
    return this.getTransactions('income');
  }

  getExpenseTransactions(): Observable<Transaction[]> {
    return this.getTransactions('expense');
  }

  addTransaction(transaction: TransactionForm) {
    const promise = addDoc(
      collection(this.fs, `transactions/${this.userId}/${transaction.type}`),
      transaction,
    );
    return of(promise);
  }
}

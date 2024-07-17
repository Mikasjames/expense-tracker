import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  userId: string | null = null;
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private fs: Firestore,
  ) {
    this.afAuth.authState
      .pipe(
        switchMap((user) => {
          if (user) {
            this.userId = user.uid;
            return this.getTransactions();
          } else {
            this.userId = null;
            return of([]);
          }
        }),
      )
      .subscribe((transactions) => {
        this.transactionsSubject.next(transactions);
      });
  }

  getTransactions(): Observable<Transaction[]> {
    if (!this.userId) return of([]);
    const transactionsCollection = collection(
      this.fs,
      `transactions/${this.userId}/userTransactions`,
    );
    return collectionData(transactionsCollection, {
      idField: 'id',
    }) as Observable<Transaction[]>;
  }

  addTransaction(transaction: TransactionForm) {
    const promise = addDoc(
      collection(this.fs, `transactions/${this.userId}/userTransactions`),
      transaction,
    );
    return of(promise);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Tag } from '../../models/chart.interface';
import { map } from 'rxjs/operators';
import { Transaction } from '../../models/transaction.interface';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private userId: string | null = null;
  private incomeTags = new BehaviorSubject<Tag[]>([]);
  incomeTags$ = this.incomeTags.asObservable();
  private expenseTags = new BehaviorSubject<Tag[]>([]);
  expenseTags$ = this.expenseTags.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private fs: Firestore,
  ) {
    this.afAuth.authState
      .pipe(
        switchMap((user) => {
          if (user) {
            this.userId = user.uid;
            return this.getTags();
          } else {
            this.userId = null;
            return of([]);
          }
        }),
      )
      .subscribe((tags) => {
        this.separateTagsByType(tags);
      });
  }

  getTagFromId(tagId: string, type: 'income' | 'expense') {
    return (type === 'income' ? this.incomeTags$ : this.expenseTags$).pipe(
      switchMap((tags) => {
        const tag = tags.find((tag) => tag.id === tagId);
        return of(tag || { id: '', name: '', type: type });
      }),
    );
  }

  synchronousGetTagFromId(tagId: string, type: 'income' | 'expense') {
    const tags =
      type === 'income' ? this.incomeTags.value : this.expenseTags.value;
    const tag = tags.find((tag) => tag.id === tagId);
    return tag || { id: '', name: '', type: type };
  }

  separateTagsByType(tags: Tag[]): void {
    this.incomeTags.next(tags.filter((tag) => tag.type === 'income'));
    this.expenseTags.next(tags.filter((tag) => tag.type === 'expense'));
  }

  getTags(): Observable<Tag[]> {
    if (!this.userId) return of([]);
    const tagsCollection = collection(this.fs, `tags/${this.userId}/userTags`);
    return collectionData(tagsCollection, { idField: 'id' }) as Observable<
      Tag[]
    >;
  }

  addTag(tag: string, type: 'income' | 'expense'): Observable<string> {
    if (!this.userId) return of('');
    const newTag = { name: tag, type: type };
    return new Observable((observer) => {
      addDoc(collection(this.fs, `tags/${this.userId}/userTags`), newTag)
        .then((docRef) => {
          observer.next(docRef.id);
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  updateTag(tagId: string, updates: Partial<Tag>): Observable<void> {
    if (!this.userId) return of();
    const tagRef = doc(this.fs, `tags/${this.userId}/userTags/${tagId}`);
    return new Observable((observer) => {
      updateDoc(tagRef, updates)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  deleteTag(tagId: string): Observable<void> {
    if (!this.userId) return of();
    const tagRef = doc(this.fs, `tags/${this.userId}/userTags/${tagId}`);
    return new Observable((observer) => {
      deleteDoc(tagRef)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  addTagToTransaction(
    transactionId: string,
    tagId: string,
    transactionType: 'income' | 'expense',
  ): Observable<void> {
    if (!this.userId) return of();
    const transactionRef = doc(
      this.fs,
      `transactions/${this.userId}/${transactionType}/${transactionId}`,
    );
    return new Observable((observer) => {
      updateDoc(transactionRef, {
        tagIds: arrayUnion(tagId),
      })
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  removeTagFromTransaction(
    transactionId: string,
    tagId: string,
    transactionType: 'income' | 'expense',
  ): Observable<void> {
    if (!this.userId) return of();
    const transactionRef = doc(
      this.fs,
      `transactions/${this.userId}/${transactionType}/${transactionId}`,
    );
    return new Observable((observer) => {
      updateDoc(transactionRef, {
        tagIds: arrayRemove(tagId),
      })
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  getTagsForTransaction(
    transactionId: string,
    transactionType: 'income' | 'expense',
  ): Observable<Tag[]> {
    if (!this.userId) return of([]);
    const transactionRef = doc(
      this.fs,
      `transactions/${this.userId}/${transactionType}/${transactionId}`,
    );
    return new Observable((observer) => {
      getDoc(transactionRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const transaction = {
              id: docSnap.id,
              ...docSnap.data(),
            } as Transaction;
            this.getTags()
              .pipe(
                map((allTags) =>
                  allTags.filter((tag) => transaction.tagIds.includes(tag.id)),
                ),
              )
              .subscribe(
                (tags) => {
                  observer.next(tags);
                  observer.complete();
                },
                (error) => observer.error(error),
              );
          } else {
            observer.next([]);
            observer.complete();
          }
        })
        .catch((error) => observer.error(error));
    });
  }

  // New method to get transactions by tag
  getTransactionsByTag(
    tagId: string,
    transactionType: 'income' | 'expense',
  ): Observable<Transaction[]> {
    if (!this.userId) return of([]);
    const transactionsCollection = collection(
      this.fs,
      `transactions/${this.userId}/${transactionType}`,
    );
    return collectionData(transactionsCollection, { idField: 'id' }).pipe(
      map((transactions) => {
        return (transactions as any[]).filter((transaction) => {
          // Safely access tagIds, assuming it might not exist on some documents
          const tagIds = transaction.tagIds || [];
          return Array.isArray(tagIds) && tagIds.includes(tagId);
        }) as Transaction[];
      }),
    );
  }
}

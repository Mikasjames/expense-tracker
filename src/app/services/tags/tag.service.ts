import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  updateDoc,
} from '@angular/fire/firestore';
import { Tag } from '../../models/chart.interface';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private userId: string | null = null;
  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  tags$ = this.tagsSubject.asObservable();

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
        this.tagsSubject.next(tags);
      });
  }

  getTags(): Observable<Tag[]> {
    if (!this.userId) return of([]);
    const tagsCollection = collection(this.fs, `tags/${this.userId}/userTags`);
    return collectionData(tagsCollection, { idField: 'id' }) as Observable<
      Tag[]
    >;
  }

  addTag(tag: Omit<Tag, 'id' | 'userId'>): Observable<any> {
    if (!this.userId) return of(null);
    const newTag = { ...tag, userId: this.userId };
    const promise = addDoc(
      collection(this.fs, `tags/${this.userId}/userTags`),
      newTag,
    );
    return of(promise);
  }

  updateTag(tagId: string, updates: Partial<Tag>): Observable<any> {
    if (!this.userId) return of(null);
    const tagRef = doc(this.fs, `tags/${this.userId}/userTags/${tagId}`);
    const promise = updateDoc(tagRef, updates);
    return of(promise);
  }

  deleteTag(tagId: string): Observable<any> {
    if (!this.userId) return of(null);
    const tagRef = doc(this.fs, `tags/${this.userId}/userTags/${tagId}`);
    const promise = deleteDoc(tagRef);
    return of(promise);
  }
}

import {
  Injectable,
  InjectionToken,
  NgZone,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  onIdTokenChanged,
} from 'firebase/auth';
import {
  DocumentReference,
  Firestore,
  Query,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const AUTH = new InjectionToken<Auth>('expense-tracker.firebase.auth');
export const FIRESTORE = new InjectionToken<Firestore>(
  'expense-tracker.firebase.firestore',
);

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly app = initializeApp(environment.firebaseConfig);

  readonly auth: Auth = isPlatformBrowser(this.platformId)
    ? getAuth(this.app)
    : initializeAuth(this.app, { persistence: inMemoryPersistence });

  readonly fs: Firestore = getFirestore(this.app);

  authState$(auth: Auth = this.auth): Observable<User | null> {
    return this.fromCallback<User | null>((next, error) =>
      onAuthStateChanged(auth, next, error),
    );
  }

  user$(auth: Auth = this.auth): Observable<User | null> {
    return this.fromCallback<User | null>((next, error) =>
      onIdTokenChanged(auth, next, error),
    );
  }

  docData$<T>(ref: DocumentReference<T>): Observable<T | undefined> {
    return this.fromCallback<T | undefined>((next, error) =>
      onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => next(snap.exists() ? snap.data() : undefined),
        error,
      ),
    );
  }

  collectionData$<T>(ref: Query<T>, idField?: string): Observable<T[]> {
    return this.fromCallback<T[]>((next, error) =>
      onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) =>
          next(
            snap.docs.map((d) => {
              const data = d.data();
              if (idField) {
                return { ...data, [idField]: d.id };
              }
              return data;
            }),
          ),
        error,
      ),
    );
  }

  private fromCallback<T>(
    subscribe: (
      next: (value: T) => void,
      error: (err: unknown) => void,
    ) => () => void,
  ): Observable<T> {
    return new Observable<T>((subscriber) => {
      const unsubscribe = subscribe(
        (value) => this.zone.run(() => subscriber.next(value)),
        (err) => this.zone.run(() => subscriber.error(err)),
      );
      return { unsubscribe };
    });
  }
}

import { Injectable, Inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  BehaviorSubject,
  distinctUntilChanged,
  from,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import {
  AUTH,
  FIRESTORE,
  FirebaseService,
} from '../firebase/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = this.fb.user$();
  private currentUserSubject = new BehaviorSubject<
    UserInterface | null | undefined
  >(undefined);
  currentUser$ = this.currentUserSubject
    .asObservable()
    .pipe(distinctUntilChanged(), shareReplay(1));

  constructor(
    @Inject(AUTH) private firebaseAuth: Auth,
    private router: Router,
    @Inject(FIRESTORE) private firestore: Firestore,
    private fb: FirebaseService,
  ) {}

  initializeUserState() {
    this.user$
      .pipe(
        switchMap((user) => {
          if (user) {
            return this.fb.docData$(
              doc(this.firestore, `users/${user.uid}`) as DocumentReference<
                UserInterface & { isAdmin?: boolean }
              >,
            );
          } else {
            return of(null);
          }
        }),
      )
      .subscribe((user) => {
        this.currentUserSubject.next(
          user
            ? {
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
              }
            : null,
        );
      });
  }

  register(
    email: string,
    password: string,
    username: string,
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then((response) => {
      return updateProfile(response.user, { displayName: username }).then(() => {
        return setDoc(doc(this.firestore, `users/${response.user.uid}`), {
          email,
          username,
        });
      });
    });

    return from(promise);
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then(() => {});
    return from(promise);
  }

  logout() {
    this.firebaseAuth.signOut().then(() => {
      this.currentUserSubject.next(null);
      this.router.navigateByUrl('/login');
    });
  }

  googleSignIn() {
    return signInWithPopup(this.firebaseAuth, new GoogleAuthProvider()).then(
      async (res) => {
        if (res.user) {
          await this.updateUserData(
            res.user.uid,
            res.user.email || '',
            res.user.displayName || '',
          );
        }
        this.router.navigate(['/dashboard']);
        localStorage.setItem('token', JSON.stringify(res.user?.uid));
      },
      (error) => {
        console.log(error);
      },
    );
  }

  facebookSignIn() {
    return signInWithPopup(this.firebaseAuth, new FacebookAuthProvider()).then(
      (res) => {
        if (res.user) {
          this.updateUserData(
            res.user.uid,
            res.user.email || '',
            res.user.displayName || '',
          );
        }
        this.router.navigate(['/dashboard']);
        localStorage.setItem('token', JSON.stringify(res.user?.uid));
      },
      (error) => {
        console.log(error);
      },
    );
  }

  private async updateUserData(uid: string, email: string, username: string) {
    const existingUser = await this.getUserData(uid);
    const userData: UserInterface & { isAdmin: boolean } = {
      email,
      username,
      isAdmin: existingUser?.isAdmin ?? false, // Preserve existing admin status or set to false if not present
    };
    return setDoc(doc(this.firestore, `users/${uid}`), userData, {
      merge: true,
    });
  }

  private async getUserData(
    uid: string,
  ): Promise<(UserInterface & { isAdmin?: boolean }) | null> {
    const docSnap = await getDoc(
      doc(this.firestore, `users/${uid}`),
    );
    return docSnap.exists()
      ? (docSnap.data() as UserInterface & { isAdmin?: boolean })
      : null;
  }

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.fb.docData$(
            doc(this.firestore, `users/${user.uid}`) as DocumentReference<{
              isAdmin?: boolean;
            }>,
          );
        } else {
          return of(null);
        }
      }),
      map((user) => user?.isAdmin || false),
    );
  }

  setAdminStatus(uid: string, isAdmin: boolean): Promise<void> {
    return updateDoc(doc(this.firestore, `users/${uid}`), { isAdmin });
  }

  getAllUsers(): Observable<UserInterface[]> {
    return this.fb.collectionData$(
      collection(this.firestore, 'users') as CollectionReference<UserInterface>,
    );
  }
}

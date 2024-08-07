import { Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from '@angular/fire/auth';
import { from, Observable, of, switchMap } from 'rxjs';
import { UserInterface } from '../../models/user.interface';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null | undefined>(undefined);

  constructor(
    private firebaseAuth: Auth,
    private router: Router,
    private fireAuth: AngularFireAuth,
    private firestore: AngularFirestore,
  ) {
    this.initializeUserState();
  }

  private initializeUserState() {
    this.user$
      .pipe(
        switchMap((user) => {
          if (user) {
            return this.firestore
              .doc<UserInterface & { isAdmin?: boolean }>(`users/${user.uid}`)
              .valueChanges();
          } else {
            return of(null);
          }
        }),
      )
      .subscribe((user) => {
        this.currentUserSig.set(
          user
            ? {
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
              }
            : null,
        );
        console.log(this.currentUserSig());
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
      updateProfile(response.user, { displayName: username }).then(() => {
        this.firestore.doc(`users/${response.user.uid}`).set({
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
      this.currentUserSig.set(null);
      this.router.navigateByUrl('/login');
    });
  }

  googleSignIn() {
    return this.fireAuth.signInWithPopup(new GoogleAuthProvider()).then(
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
    return this.fireAuth.signInWithPopup(new FacebookAuthProvider()).then(
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
    return this.firestore.doc(`users/${uid}`).set(userData, { merge: true });
  }

  private getUserData(
    uid: string,
  ): Promise<(UserInterface & { isAdmin?: boolean }) | null> {
    return this.firestore
      .doc<UserInterface & { isAdmin?: boolean }>(`users/${uid}`)
      .get()
      .toPromise()
      .then((doc) => doc?.data() || null);
  }

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc<{ isAdmin?: boolean }>(`users/${user.uid}`)
            .valueChanges();
        } else {
          return of(null);
        }
      }),
      map((user) => user?.isAdmin || false),
    );
  }

  setAdminStatus(uid: string, isAdmin: boolean): Promise<void> {
    return this.firestore.doc(`users/${uid}`).update({ isAdmin });
  }

  getAllUsers(): Observable<UserInterface[]> {
    return this.firestore.collection<UserInterface>('users').valueChanges();
  }
}

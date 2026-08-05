const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => ({ collection: true })),
  doc: vi.fn(() => ({ ref: 'doc' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  signInWithEmailAndPassword: authMocks.signInWithEmailAndPassword,
  signInWithPopup: authMocks.signInWithPopup,
  updateProfile: authMocks.updateProfile,
  GoogleAuthProvider: authMocks.GoogleAuthProvider,
  FacebookAuthProvider: authMocks.FacebookAuthProvider,
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  setDoc: firestoreMocks.setDoc,
  updateDoc: firestoreMocks.updateDoc,
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { AUTH, FIRESTORE, FirebaseService } from '../firebase/firebase.service';
import {
  createFirebaseServiceStub,
  FirebaseServiceStub,
} from '../../testing/service-stubs';

describe('AuthService', () => {
  let service: AuthService;
  let fb: FirebaseServiceStub;
  let router: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn> };
  const authToken = {
    signOut: vi.fn(() => Promise.resolve()),
    currentUser: { uid: 'cu', displayName: 'Current' },
  };

  beforeEach(() => {
    localStorage.clear();
    Object.values(authMocks).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    Object.values(firestoreMocks).forEach((fn) =>
      (fn as ReturnType<typeof vi.fn>).mockReset(),
    );
    (authToken.signOut as ReturnType<typeof vi.fn>).mockReset();
    (authToken.signOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    fb = createFirebaseServiceStub();
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH, useValue: authToken },
        { provide: FIRESTORE, useValue: {} },
        { provide: FirebaseService, useValue: fb },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeUserState', () => {
    it('populates currentUser$ from the firestore document when signed in', () => {
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });
      (fb._docData as { next: (v: unknown) => void }).next({
        email: 'a@b.c',
        username: 'Alice',
        isAdmin: true,
      });

      service.initializeUserState();

      let received: unknown;
      service.currentUser$.subscribe((u) => (received = u));
      expect(received).toEqual({
        email: 'a@b.c',
        username: 'Alice',
        isAdmin: true,
      });
    });

    it('emits null when there is no signed-in user', () => {
      service.initializeUserState();

      let received: unknown = 'sentinel';
      service.currentUser$.subscribe((u) => (received = u));
      expect(received).toBeNull();
    });
  });

  describe('register', () => {
    it('creates the user, sets the profile and writes the user document', async () => {
      authMocks.createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'new-uid' },
      });
      authMocks.updateProfile.mockResolvedValue(undefined);
      firestoreMocks.setDoc.mockResolvedValue(undefined);

      const result = await firstValueFrom(
        service.register('a@b.c', 'pw', 'Alice'),
      );

      expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        authToken,
        'a@b.c',
        'pw',
      );
      expect(authMocks.updateProfile).toHaveBeenCalled();
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith({ ref: 'doc' }, {
        email: 'a@b.c',
        username: 'Alice',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('login', () => {
    it('signs in with email and password', async () => {
      authMocks.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'u' } });

      const result = await firstValueFrom(service.login('a@b.c', 'pw'));

      expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
        authToken,
        'a@b.c',
        'pw',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('signs out, clears the user and navigates to login', async () => {
      service.logout();

      await Promise.resolve();

      expect(authToken.signOut).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
      let received: unknown = 'sentinel';
      service.currentUser$.subscribe((u) => (received = u));
      expect(received).toBeNull();
    });
  });

  describe('googleSignIn', () => {
    it('signs in via popup and stores the token', async () => {
      authMocks.signInWithPopup.mockResolvedValue({
        user: { uid: 'g1', email: 'g@b.c', displayName: 'Gina' },
      });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      });

      await service.googleSignIn();

      expect(authMocks.signInWithPopup).toHaveBeenCalledWith(
        authToken,
        expect.any(authMocks.GoogleAuthProvider),
      );
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(localStorage.getItem('token')).toBe(JSON.stringify('g1'));
    });

    it('preserves the admin flag when the user already exists', async () => {
      authMocks.signInWithPopup.mockResolvedValue({
        user: { uid: 'g2', email: 'g2@b.c', displayName: 'G2' },
      });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ isAdmin: true }),
      });

      await service.googleSignIn();

      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { email: 'g2@b.c', username: 'G2', isAdmin: true },
        { merge: true },
      );
    });

    it('uses empty strings when profile fields are missing', async () => {
      authMocks.signInWithPopup.mockResolvedValue({
        user: { uid: 'g3', email: null, displayName: null },
      });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      });

      await service.googleSignIn();

      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { email: '', username: '', isAdmin: false },
        { merge: true },
      );
    });

    it('still navigates when the popup returns no user', async () => {
      authMocks.signInWithPopup.mockResolvedValue({ user: null });

      await service.googleSignIn();

      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(localStorage.getItem('token')).toBe('undefined');
    });

    it('logs an error when the popup fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      authMocks.signInWithPopup.mockRejectedValue(new Error('popup denied'));

      await expect(service.googleSignIn()).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(new Error('popup denied'));
      consoleSpy.mockRestore();
    });
  });

  describe('facebookSignIn', () => {
    it('signs in via popup and stores the token', async () => {
      authMocks.signInWithPopup.mockResolvedValue({
        user: { uid: 'f1', email: 'f@b.c', displayName: 'Fia' },
      });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      });

      await service.facebookSignIn();
      await Promise.resolve();

      expect(authMocks.signInWithPopup).toHaveBeenCalledWith(
        authToken,
        expect.any(authMocks.FacebookAuthProvider),
      );
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(localStorage.getItem('token')).toBe(JSON.stringify('f1'));
    });

    it('uses empty strings when profile fields are missing', async () => {
      authMocks.signInWithPopup.mockResolvedValue({
        user: { uid: 'f2', email: null, displayName: null },
      });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({}),
      });

      await service.facebookSignIn();
      await Promise.resolve();

      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { email: '', username: '', isAdmin: false },
        { merge: true },
      );
    });

    it('still navigates when the popup returns no user', async () => {
      authMocks.signInWithPopup.mockResolvedValue({ user: null });

      await service.facebookSignIn();
      await Promise.resolve();

      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(localStorage.getItem('token')).toBe('undefined');
    });

    it('logs an error when the popup fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      authMocks.signInWithPopup.mockRejectedValue(new Error('fb denied'));

      await expect(service.facebookSignIn()).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('isAdmin', () => {
    it('returns true when the user document marks them as admin', () => {
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });
      (fb._docData as { next: (v: unknown) => void }).next({ isAdmin: true });

      let result = false;
      service.isAdmin().subscribe((r) => (result = r));
      expect(result).toBe(true);
    });

    it('returns false when not signed in', () => {
      let result: boolean | undefined;
      service.isAdmin().subscribe((r) => (result = r));
      expect(result).toBe(false);
    });

    it('returns false when the admin flag is missing', () => {
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });
      (fb._docData as { next: (v: unknown) => void }).next(undefined);

      let result: boolean | undefined;
      service.isAdmin().subscribe((r) => (result = r));
      expect(result).toBe(false);
    });
  });

  describe('setAdminStatus', () => {
    it('updates the user document', async () => {
      await service.setAdminStatus('u9', true);

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { isAdmin: true },
      );
    });
  });

  describe('getAllUsers', () => {
    it('returns users from the collection', () => {
      const users = [
        { email: 'a@b.c', username: 'A' },
        { email: 'b@b.c', username: 'B' },
      ];
      (fb._collectionData as { next: (v: unknown) => void }).next(users);

      let received: unknown;
      service.getAllUsers().subscribe((u) => (received = u));
      expect(received).toEqual(users);
    });
  });
});

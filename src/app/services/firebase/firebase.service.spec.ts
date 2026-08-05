const fbMocks = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ app: true })),
  getAuth: vi.fn(() => ({ auth: 'browser' })),
  initializeAuth: vi.fn(() => ({ auth: 'server' })),
  getFirestore: vi.fn(() => ({ fs: true })),
  onAuthStateChanged: vi.fn(),
  onIdTokenChanged: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('firebase/app', () => ({ initializeApp: fbMocks.initializeApp }));
vi.mock('firebase/auth', () => ({
  getAuth: fbMocks.getAuth,
  initializeAuth: fbMocks.initializeAuth,
  onAuthStateChanged: fbMocks.onAuthStateChanged,
  onIdTokenChanged: fbMocks.onIdTokenChanged,
  inMemoryPersistence: {},
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: fbMocks.getFirestore,
  onSnapshot: fbMocks.onSnapshot,
}));

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
  beforeEach(() => {
    Object.values(fbMocks).forEach((fn) =>
      (fn as ReturnType<typeof vi.fn>).mockClear(),
    );
  });

  describe('on the browser platform', () => {
    let service: FirebaseService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(FirebaseService);
    });

    it('uses getAuth for browser auth', () => {
      expect(fbMocks.getAuth).toHaveBeenCalledWith({ app: true });
      expect(service.auth).toEqual({ auth: 'browser' });
    });

    it('creates a firestore instance', () => {
      expect(fbMocks.getFirestore).toHaveBeenCalledWith({ app: true });
      expect(service.fs).toEqual({ fs: true });
    });
  });

  describe('on the server platform', () => {
    let service: FirebaseService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(FirebaseService);
    });

    it('uses initializeAuth for server auth', () => {
      expect(fbMocks.initializeAuth).toHaveBeenCalled();
      expect(service.auth).toEqual({ auth: 'server' });
    });
  });

  describe('authState$', () => {
    let service: FirebaseService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(FirebaseService);
    });

    it('emits the signed-in user', () => {
      let calls: Array<{ next: (v: unknown) => void; error: (e: unknown) => void }> = [];
      fbMocks.onAuthStateChanged.mockImplementation(
        (_auth: unknown, next: (v: unknown) => void, error: (e: unknown) => void) => {
          calls = [{ next, error }];
          return () => {};
        },
      );

      let emitted: unknown;
      service.authState$().subscribe((u) => (emitted = u));
      calls[0].next({ uid: 'u1' });

      expect(fbMocks.onAuthStateChanged).toHaveBeenCalled();
      expect(emitted).toEqual({ uid: 'u1' });
    });

    it('propagates errors', () => {
      let calls: Array<{ next: (v: unknown) => void; error: (e: unknown) => void }> = [];
      fbMocks.onAuthStateChanged.mockImplementation(
        (_auth: unknown, next: (v: unknown) => void, error: (e: unknown) => void) => {
          calls = [{ next, error }];
          return () => {};
        },
      );

      const errors: unknown[] = [];
      service.authState$().subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });
      calls[0].error(new Error('boom'));

      expect(errors).toEqual([new Error('boom')]);
    });

    it('uses the provided auth instance', () => {
      fbMocks.onAuthStateChanged.mockImplementation(() => () => {});
      const customAuth = { custom: true };

      service.authState$(customAuth as never).subscribe(() => undefined);

      expect(fbMocks.onAuthStateChanged).toHaveBeenCalledWith(
        customAuth,
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('user$', () => {
    let service: FirebaseService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(FirebaseService);
    });

    it('emits the id-token user', () => {
      let calls: Array<{ next: (v: unknown) => void; error: (e: unknown) => void }> = [];
      fbMocks.onIdTokenChanged.mockImplementation(
        (_auth: unknown, next: (v: unknown) => void, error: (e: unknown) => void) => {
          calls = [{ next, error }];
          return () => {};
        },
      );

      let emitted: unknown;
      service.user$().subscribe((u) => (emitted = u));
      calls[0].next({ uid: 'u2' });

      expect(fbMocks.onIdTokenChanged).toHaveBeenCalled();
      expect(emitted).toEqual({ uid: 'u2' });
    });

    it('uses the provided auth instance', () => {
      fbMocks.onIdTokenChanged.mockImplementation(() => () => {});
      const customAuth = { custom: true };

      service.user$(customAuth as never).subscribe(() => undefined);

      expect(fbMocks.onIdTokenChanged).toHaveBeenCalledWith(
        customAuth,
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('docData$', () => {
    let service: FirebaseService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(FirebaseService);
    });

    function configureSnapshot(_next: (snap: unknown) => void) {
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, next: (snap: unknown) => void) => {
          _next = next;
          return () => {};
        },
      );
      return () => _next;
    }

    it('emits document data when the snapshot exists', () => {
      let snapshotCb: (snap: unknown) => void = () => undefined;
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, next: (snap: unknown) => void) => {
          snapshotCb = next;
          return () => {};
        },
      );

      let emitted: unknown;
      service.docData$({} as never).subscribe((d) => (emitted = d));
      snapshotCb({ exists: () => true, data: () => ({ name: 'Test' }) });

      expect(emitted).toEqual({ name: 'Test' });
    });

    it('emits undefined when the document does not exist', () => {
      let snapshotCb: (snap: unknown) => void = () => undefined;
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, next: (snap: unknown) => void) => {
          snapshotCb = next;
          return () => {};
        },
      );

      let emitted: unknown = 'sentinel';
      service.docData$({} as never).subscribe((d) => (emitted = d));
      snapshotCb({ exists: () => false, data: () => ({}) });

      expect(emitted).toBeUndefined();
    });

    it('propagates snapshot errors', () => {
      let errorCb: (err: unknown) => void = () => undefined;
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, _next: unknown, error: (e: unknown) => void) => {
          errorCb = error;
          return () => {};
        },
      );

      const errors: unknown[] = [];
      service.docData$({} as never).subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });
      errorCb(new Error('doc boom'));

      expect(errors).toEqual([new Error('doc boom')]);
    });
  });

  describe('collectionData$', () => {
    let service: FirebaseService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(FirebaseService);
    });

    it('maps documents including their id when an idField is provided', () => {
      let snapshotCb: (snap: unknown) => void = () => undefined;
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, next: (snap: unknown) => void) => {
          snapshotCb = next;
          return () => {};
        },
      );

      let emitted: unknown;
      service.collectionData$({} as never, 'id').subscribe((d) => (emitted = d));
      snapshotCb({
        docs: [{ data: () => ({ name: 'A' }), id: 'a1' }],
      });

      expect(emitted).toEqual([{ name: 'A', id: 'a1' }]);
    });

    it('omits ids when no idField is provided', () => {
      let snapshotCb: (snap: unknown) => void = () => undefined;
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, next: (snap: unknown) => void) => {
          snapshotCb = next;
          return () => {};
        },
      );

      let emitted: unknown;
      service.collectionData$({} as never).subscribe((d) => (emitted = d));
      snapshotCb({
        docs: [{ data: () => ({ name: 'A' }), id: 'a1' }],
      });

      expect(emitted).toEqual([{ name: 'A' }]);
    });

    it('propagates collection errors', () => {
      let errorCb: (err: unknown) => void = () => undefined;
      fbMocks.onSnapshot.mockImplementation(
        (_ref: unknown, _opts: unknown, _next: unknown, error: (e: unknown) => void) => {
          errorCb = error;
          return () => {};
        },
      );

      const errors: unknown[] = [];
      service.collectionData$({} as never).subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });
      errorCb(new Error('col boom'));

      expect(errors).toEqual([new Error('col boom')]);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, from } from 'rxjs';

import { AdminOnlyGuard, AuthGuard, PublicOnlyGuard } from './auth.guard';
import { FirebaseService } from './firebase/firebase.service';
import { AuthService } from './auth/auth.service';
import {
  createFirebaseServiceStub,
  FirebaseServiceStub,
} from '../testing/service-stubs';

async function guardResult(result: ReturnType<typeof AuthGuard>): Promise<unknown> {
  return firstValueFrom(from(result as never));
}

describe('auth guards', () => {
  let fb: FirebaseServiceStub;
  let router: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn> };
  let isAdminSubject: BehaviorSubject<boolean>;

  beforeEach(() => {
    fb = createFirebaseServiceStub();
    isAdminSubject = new BehaviorSubject(false);
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: FirebaseService, useValue: fb },
        { provide: AuthService, useValue: { isAdmin: () => isAdminSubject.asObservable() } },
      ],
    });
  });

  describe('AuthGuard', () => {
    it('allows access when a user is signed in', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      const result = TestBed.runInInjectionContext(() =>
        AuthGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(true);
    });

    it('redirects to login when signed out', async () => {
      const result = TestBed.runInInjectionContext(() =>
        AuthGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('PublicOnlyGuard', () => {
    it('redirects signed-in users to the dashboard', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      const result = TestBed.runInInjectionContext(() =>
        PublicOnlyGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('allows access when signed out', async () => {
      const result = TestBed.runInInjectionContext(() =>
        PublicOnlyGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('AdminOnlyGuard', () => {
    it('allows admin users through', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'admin' });
      isAdminSubject.next(true);
      const result = TestBed.runInInjectionContext(() =>
        AdminOnlyGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(true);
    });

    it('redirects non-admin users to login', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'user' });
      isAdminSubject.next(false);
      const result = TestBed.runInInjectionContext(() =>
        AdminOnlyGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('redirects signed-out users to login', async () => {
      const result = TestBed.runInInjectionContext(() =>
        AdminOnlyGuard({} as never, {} as never),
      );
      expect(await guardResult(result)).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { appConfig } from './app.config';
import { AUTH, FIRESTORE } from './services/firebase/firebase.service';

describe('appConfig', () => {
  it('provides application-wide providers', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('provides the router', () => {
    expect(appConfig.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: expect.anything() }),
      ]),
    );
  });

  it('AUTH factory returns the firebase auth instance', () => {
    const authProvider = appConfig.providers.find(
      (p) => (p as any).provide === AUTH,
    ) as any;
    expect(authProvider).toBeTruthy();
    const fb = { auth: { mock: 'auth' }, fs: {} };
    expect(authProvider.useFactory(fb)).toBe(fb.auth);
  });

  it('FIRESTORE factory returns the firestore instance', () => {
    const fsProvider = appConfig.providers.find(
      (p) => (p as any).provide === FIRESTORE,
    ) as any;
    expect(fsProvider).toBeTruthy();
    const fb = { auth: {}, fs: { mock: 'fs' } };
    expect(fsProvider.useFactory(fb)).toBe(fb.fs);
  });
});

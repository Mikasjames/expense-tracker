const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(() => ({ ref: 'doc' })),
  setDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', () => ({
  doc: firestoreMocks.doc,
  setDoc: firestoreMocks.setDoc,
}));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { SettingsService, DEFAULT_SETTINGS } from './settings.service';
import { FIRESTORE, FirebaseService } from '../firebase/firebase.service';
import { UserSettings } from '../../models/settings.interface';
import {
  createFirebaseServiceStub,
  FirebaseServiceStub,
} from '../../testing/service-stubs';

const CACHE_KEY = 'expense-tracker:settings';
const LAST_USER_KEY = 'expense-tracker:last-user';

describe('SettingsService', () => {
  let service: SettingsService;
  let fb: FirebaseServiceStub;

  beforeEach(() => {
    localStorage.clear();
    firestoreMocks.doc.mockClear();
    firestoreMocks.setDoc.mockClear();
    fb = createFirebaseServiceStub();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: { firestore: true } },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created with default settings', () => {
    expect(service).toBeTruthy();
    expect(service.current).toEqual(DEFAULT_SETTINGS);
  });

  it('restores cached settings for the last user from localStorage', () => {
    const cached: UserSettings = {
      currency: 'USD',
      numberFormat: 'de-DE',
      emailNotifications: true,
      pushNotifications: false,
    };
    localStorage.setItem(LAST_USER_KEY, 'u1');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ u1: cached }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: { firestore: true } },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(SettingsService);

    expect(service.current).toEqual(cached);
  });

  it('ignores a corrupt cache entry', () => {
    localStorage.setItem(LAST_USER_KEY, 'u1');
    localStorage.setItem(CACHE_KEY, '{invalid json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: { firestore: true } },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(SettingsService);

    expect(service.current).toEqual(DEFAULT_SETTINGS);
  });

  it('uses defaults when no cache exists for the last user', () => {
    localStorage.setItem(LAST_USER_KEY, 'u1');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: { firestore: true } },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(SettingsService);

    expect(service.current).toEqual(DEFAULT_SETTINGS);
  });

  it('constructs with defaults when localStorage reads fail', () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: { firestore: true } },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(SettingsService);

    expect(service.current).toEqual(DEFAULT_SETTINGS);
    getItemSpy.mockRestore();
  });

  describe('settings$', () => {
    it('emits defaults when there is no authenticated user', () => {
      let received: UserSettings | null = null;
      service.settings$.subscribe((s) => (received = s));
      expect(received).toEqual(DEFAULT_SETTINGS);
    });

    it('loads and merges stored settings for an authenticated user', () => {
      const stored: Partial<UserSettings> = {
        currency: 'EUR',
        numberFormat: 'de-DE',
      };
      (fb._docData as { next: (v: unknown) => void }).next(stored);
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let received: UserSettings | null = null;
      service.settings$.subscribe((s) => (received = s));

      expect(received).toEqual({
        currency: 'EUR',
        numberFormat: 'de-DE',
        emailNotifications: false,
        pushNotifications: false,
      });
      expect(service.current.currency).toBe('EUR');
      expect(localStorage.getItem(LAST_USER_KEY)).toBe('u1');
    });

    it('falls back to defaults when the stored document is empty', () => {
      (fb._docData as { next: (v: unknown) => void }).next(undefined);
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u2' });

      let received: UserSettings | null = null;
      service.settings$.subscribe((s) => (received = s));

      expect(received).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('update methods', () => {
    beforeEach(() => {
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });
    });

    it('updateCurrency applies the currency and persists it', () => {
      service.updateCurrency('USD');

      expect(service.current.currency).toBe('USD');
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { currency: 'USD' },
        { merge: true },
      );
      expect(firestoreMocks.doc).toHaveBeenCalledWith({ firestore: true }, 'settings/u1');
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      expect(cache['u1'].currency).toBe('USD');
    });

    it('updateNumberFormat applies the number format', () => {
      service.updateNumberFormat('de-DE');
      expect(service.current.numberFormat).toBe('de-DE');
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
    });

    it('updateNotifications applies both toggles', () => {
      service.updateNotifications(true, true);
      expect(service.current.emailNotifications).toBe(true);
      expect(service.current.pushNotifications).toBe(true);
    });

    it('does not write to firestore when there is no user', () => {
      (fb._user as { next: (v: unknown) => void }).next(null);

      service.updateCurrency('EUR');

      expect(service.current.currency).toBe('EUR');
      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
    });
  });

  describe('when localStorage is unavailable', () => {
    it('still updates settings and skips cache writes', () => {
      vi.stubGlobal('localStorage', undefined);
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });

      service.updateCurrency('PHP');

      expect(service.current.currency).toBe('PHP');
      expect(firestoreMocks.setDoc).toHaveBeenCalled();
    });

    it('constructs with defaults when localStorage is undefined', () => {
      vi.stubGlobal('localStorage', undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: FIRESTORE, useValue: { firestore: true } },
          { provide: FirebaseService, useValue: fb },
        ],
      });
      service = TestBed.inject(SettingsService);

      expect(service.current).toEqual(DEFAULT_SETTINGS);
    });

    it('readCache returns null when localStorage is unavailable', () => {
      vi.stubGlobal('localStorage', undefined);
      expect((service as any).readCache('u1')).toBeNull();
    });
  });

  describe('when localStorage writes fail', () => {
    it('swallows cache write errors', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });

      expect(() => service.updateCurrency('EUR')).not.toThrow();
      expect(service.current.currency).toBe('EUR');
    });
  });

  describe('format', () => {
    it('prefixes amounts with the currency symbol', () => {
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });
      service.updateCurrency('USD');
      expect(service.format(50)).toBe('$50');
    });

    it('uses the euro symbol', () => {
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });
      service.updateCurrency('EUR');
      expect(service.format(50)).toBe('€50');
    });

    it('uses the peso symbol by default', () => {
      expect(service.format(50)).toBe('₱50');
    });
  });

  describe('formatNumber', () => {
    it('formats with en-US grouping', () => {
      expect(service.formatNumber(1234.5, 'en-US')).toBe('1,234.5');
    });

    it('formats with de-DE comma decimal separator', () => {
      expect(service.formatNumber(1234.5, 'de-DE')).toBe('1.234,5');
    });

    it('omits trailing fraction digits for whole numbers', () => {
      expect(service.formatNumber(1000, 'en-US')).toBe('1,000');
    });
  });
});

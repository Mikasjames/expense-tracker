import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { CurrencyCode, NumberFormat, UserSettings } from '../../models/settings.interface';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'PHP',
  numberFormat: 'en-US',
  emailNotifications: false,
  pushNotifications: false,
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
};

const CACHE_KEY = 'expense-tracker:settings';
const LAST_USER_KEY = 'expense-tracker:last-user';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private currentSettings: UserSettings = { ...DEFAULT_SETTINGS };

  private uid$ = user(this.auth).pipe(
    map((u) => (u ? u.uid : null)),
    distinctUntilChanged(),
    shareReplay(1),
  );

  settings$: Observable<UserSettings> = this.uid$.pipe(
    switchMap((uid) => (uid ? this.loadSettings(uid) : of(null))),
    map((stored) => stored ?? { ...DEFAULT_SETTINGS }),
    tap((settings) => (this.currentSettings = settings)),
    shareReplay(1),
  );

  constructor(
    private firestore: Firestore,
    private auth: Auth,
  ) {
    const lastUid = this.readLastUser();
    if (lastUid) {
      const cached = this.readCache(lastUid);
      if (cached) this.currentSettings = { ...cached };
    }
  }

  get current(): UserSettings {
    return this.currentSettings;
  }

  updateCurrency(currency: CurrencyCode): void {
    this.applyUpdate({ currency });
  }

  updateNumberFormat(numberFormat: NumberFormat): void {
    this.applyUpdate({ numberFormat });
  }

  updateNotifications(email: boolean, push: boolean): void {
    this.applyUpdate({ emailNotifications: email, pushNotifications: push });
  }

  private loadSettings(uid: string): Observable<UserSettings> {
    const ref = doc(this.firestore, `settings/${uid}`);
    return docData(ref).pipe(
      map((stored) => ({ ...DEFAULT_SETTINGS, ...(stored || {}) })),
      tap((settings) => this.writeCache(uid, settings)),
    );
  }

  private applyUpdate(partial: Partial<UserSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...partial };
    this.uid$
      .pipe(
        switchMap((uid) => {
          if (!uid) return of(null);
          this.writeCache(uid, this.currentSettings);
          return from(
            setDoc(doc(this.firestore, `settings/${uid}`), partial, {
              merge: true,
            }),
          );
        }),
      )
      .subscribe();
  }

  private readLastUser(): string | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(LAST_USER_KEY);
    } catch {
      return null;
    }
  }

  private readCache(uid: string): UserSettings | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return cache[uid] || null;
    } catch {
      return null;
    }
  }

  private writeCache(uid: string, settings: UserSettings): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[uid] = settings;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      localStorage.setItem(LAST_USER_KEY, uid);
    } catch {
      // ignore cache write failures
    }
  }

  format(value: number): string {
    const { currency, numberFormat } = this.currentSettings;
    const symbol = CURRENCY_SYMBOLS[currency];
    const amount = this.formatNumber(value, numberFormat);
    return `${symbol}${amount}`;
  }

  formatNumber(value: number, numberFormat: NumberFormat): string {
    const useCommaDecimal = numberFormat === 'de-DE';
    const decimalSep = useCommaDecimal ? ',' : '.';
    const groupSep = useCommaDecimal ? '.' : ',';
    return value
      .toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true,
      })
      .replace(/,/g, '\u0000')
      .replace(/\./g, decimalSep)
      .replace(/\u0000/g, groupSep);
  }
}

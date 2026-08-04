export type CurrencyCode = 'PHP' | 'USD' | 'EUR';
export type NumberFormat = 'en-US' | 'de-DE';

export interface UserSettings {
  currency: CurrencyCode;
  numberFormat: NumberFormat;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

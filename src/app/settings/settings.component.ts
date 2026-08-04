import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { SettingsService } from '../services/settings/settings.service';
import {
  CurrencyCode,
  NumberFormat,
  UserSettings,
} from '../models/settings.interface';
import { version } from '../../../package.json';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-settings',
  imports: [
    HlmCardImports,
    HlmNativeSelectImports,
    HlmSwitchImports,
    HlmButtonImports,
    NgIcon,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings.component.sass',
})
export class SettingsComponent implements OnInit {
  appVersion = version;
  settings: UserSettings;

  constructor(
    private authService: AuthService,
    private router: Router,
    private settingsService: SettingsService,
  ) {
    this.settings = { ...this.settingsService.current };
  }

  ngOnInit() {
    this.settingsService.settings$.subscribe((s) => {
      this.settings = { ...s };
    });
  }

  setCurrency(currency: CurrencyCode | string | null | undefined) {
    if (!currency) return;
    this.settingsService.updateCurrency(currency as CurrencyCode);
  }

  setNumberFormat(numberFormat: NumberFormat | string | null | undefined) {
    if (!numberFormat) return;
    this.settingsService.updateNumberFormat(numberFormat as NumberFormat);
  }

  setEmailNotifications(enabled: boolean) {
    this.settingsService.updateNotifications(
      enabled,
      this.settings.pushNotifications,
    );
  }

  setPushNotifications(enabled: boolean) {
    this.settingsService.updateNotifications(
      this.settings.emailNotifications,
      enabled,
    );
  }

  logout() {
    this.authService.logout();
  }
}

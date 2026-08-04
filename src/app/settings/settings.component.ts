import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { SettingsService } from '../services/settings/settings.service';
import { CurrencyCode, NumberFormat, UserSettings } from '../models/settings.interface';
import { version } from '../../../package.json';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
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

  setCurrency(currency: CurrencyCode) {
    this.settingsService.updateCurrency(currency);
  }

  setNumberFormat(numberFormat: NumberFormat) {
    this.settingsService.updateNumberFormat(numberFormat);
  }

  setEmailNotifications(enabled: boolean) {
    this.settingsService.updateNotifications(enabled, this.settings.pushNotifications);
  }

  setPushNotifications(enabled: boolean) {
    this.settingsService.updateNotifications(this.settings.emailNotifications, enabled);
  }

  logout() {
    this.authService.logout();
  }
}
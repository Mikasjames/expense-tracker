import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';

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
import { HlmInputImports } from '@spartan-ng/helm/input';
import { FormsModule } from '@angular/forms';
import { TagService } from '../services/tags/tag.service';
import { Tag } from '../models/chart.interface';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogContext,
} from '../components/confirmation-dialog/confirmation-dialog.component';
import { NotificationService } from '../services/notification/notification.service';

@Component({
  selector: 'app-settings',
  imports: [
    HlmCardImports,
    HlmNativeSelectImports,
    HlmSwitchImports,
    HlmButtonImports,
    HlmInputImports,
    FormsModule,
    AsyncPipe,
    NgIcon,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings.component.sass',
})
export class SettingsComponent implements OnInit {
  appVersion = version;
  settings: UserSettings;
  incomeTags$ = this.tagService.incomeTags$;
  expenseTags$ = this.tagService.expenseTags$;
  newIncomeTag = '';
  newExpenseTag = '';
  addingType: 'income' | 'expense' | null = null;
  deletingTagId: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private settingsService: SettingsService,
    private tagService: TagService,
    private dialogService: HlmDialogService,
    private notifications: NotificationService,
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

  addTag(type: 'income' | 'expense') {
    const name = (type === 'income' ? this.newIncomeTag : this.newExpenseTag).trim();
    if (!name || this.addingType) return;

    this.addingType = type;
    this.tagService.addTag(name, type).subscribe({
      next: (id) => {
        if (!id) {
          this.notifications.show('Sign in before adding tags.', 'error');
          return;
        }
        if (type === 'income') this.newIncomeTag = '';
        else this.newExpenseTag = '';
        this.notifications.show(`Added ${name}.`, 'success');
      },
      error: (error) => {
        console.error('Error adding tag', error);
        this.notifications.show('Could not add the tag.', 'error');
        this.addingType = null;
      },
      complete: () => (this.addingType = null),
    });
  }

  confirmDeleteTag(tag: Tag) {
    const context: ConfirmationDialogContext = {
      title: `Delete “${tag.name}”?`,
      message:
        'This removes the tag from future selections. Transactions that already use it will keep their saved tag ID.',
      confirmLabel: 'Delete tag',
      destructive: true,
      onConfirm: () => this.deleteTag(tag),
    };
    this.dialogService.open(ConfirmationDialogComponent, {
      context,
      contentClass:
        'mx-auto h-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl p-6 sm:mx-auto',
      showCloseButton: false,
    });
  }

  private deleteTag(tag: Tag) {
    if (this.deletingTagId) return;
    this.deletingTagId = tag.id;
    this.tagService.deleteTag(tag.id).subscribe({
      next: () => this.notifications.show(`Deleted ${tag.name}.`, 'success'),
      error: (error) => {
        console.error('Error deleting tag', error);
        this.notifications.show('Could not delete the tag.', 'error');
        this.deletingTagId = null;
      },
      complete: () => (this.deletingTagId = null),
    });
  }
}

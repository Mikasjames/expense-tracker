import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import { AuthService } from '../services/auth/auth.service';
import { SettingsService } from '../services/settings/settings.service';
import { TagService } from '../services/tags/tag.service';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { NotificationService } from '../services/notification/notification.service';
import { Tag } from '../models/chart.interface';
import {
  createRouterStub,
  createAuthServiceStub,
  createHlmDialogServiceStub,
} from '../testing/service-stubs';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let routerStub: ReturnType<typeof createRouterStub>;
  let authStub: ReturnType<typeof createAuthServiceStub>;
  let settingsSubject: BehaviorSubject<any>;
  let settingsStub: {
    settings$: Observable<any>;
    current: any;
    updateCurrency: ReturnType<typeof vi.fn>;
    updateNumberFormat: ReturnType<typeof vi.fn>;
    updateNotifications: ReturnType<typeof vi.fn>;
  };
  let addTagSubject: Subject<string>;
  let deleteTagSubject: Subject<void>;
  let tagStub: {
    incomeTags$: Observable<any[]>;
    expenseTags$: Observable<any[]>;
    addTag: ReturnType<typeof vi.fn>;
    deleteTag: ReturnType<typeof vi.fn>;
  };
  let dialogStub: ReturnType<typeof createHlmDialogServiceStub>;
  let notificationStub: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerStub = createRouterStub();
    authStub = createAuthServiceStub();
    settingsSubject = new BehaviorSubject<any>({
      currency: 'USD',
      numberFormat: 'comma',
      emailNotifications: true,
      pushNotifications: false,
    });
    settingsStub = {
      settings$: settingsSubject.asObservable(),
      current: {
        currency: 'USD',
        numberFormat: 'comma',
        emailNotifications: true,
        pushNotifications: false,
      },
      updateCurrency: vi.fn(),
      updateNumberFormat: vi.fn(),
      updateNotifications: vi.fn(),
    };
    addTagSubject = new Subject<string>();
    deleteTagSubject = new Subject<void>();
    const incomeTags = new BehaviorSubject<any[]>([]);
    const expenseTags = new BehaviorSubject<any[]>([]);
    tagStub = {
      incomeTags$: incomeTags.asObservable(),
      expenseTags$: expenseTags.asObservable(),
      addTag: vi.fn(() => addTagSubject.asObservable()),
      deleteTag: vi.fn(() => deleteTagSubject.asObservable()),
    };
    dialogStub = createHlmDialogServiceStub();
    notificationStub = { show: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authStub },
        { provide: SettingsService, useValue: settingsStub },
        { provide: TagService, useValue: tagStub },
        { provide: HlmDialogService, useValue: dialogStub },
        { provide: NotificationService, useValue: notificationStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reflects the app version from package.json', () => {
    expect(component.appVersion).toBeTruthy();
  });

  it('updates settings from the settings stream', () => {
    settingsSubject.next({ currency: 'EUR' });
    expect(component.settings.currency).toBe('EUR');
  });

  it('setCurrency updates the currency', () => {
    component.setCurrency('EUR');
    expect(settingsStub.updateCurrency).toHaveBeenCalledWith('EUR');
  });

  it('setCurrency ignores falsy values', () => {
    component.setCurrency(null);
    expect(settingsStub.updateCurrency).not.toHaveBeenCalled();
  });

  it('setNumberFormat updates the number format', () => {
    component.setNumberFormat('indian');
    expect(settingsStub.updateNumberFormat).toHaveBeenCalledWith('indian');
  });

  it('setNumberFormat ignores falsy values', () => {
    component.setNumberFormat(undefined);
    expect(settingsStub.updateNumberFormat).not.toHaveBeenCalled();
  });

  it('setEmailNotifications updates notifications with the current push setting', () => {
    component.setEmailNotifications(false);
    expect(settingsStub.updateNotifications).toHaveBeenCalledWith(false, false);
  });

  it('setPushNotifications updates notifications with the current email setting', () => {
    component.setPushNotifications(true);
    expect(settingsStub.updateNotifications).toHaveBeenCalledWith(true, true);
  });

  it('logout calls the auth service', () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });

  it('addTag returns early when the name is empty', () => {
    component.newIncomeTag = '   ';
    component.addTag('income');
    expect(tagStub.addTag).not.toHaveBeenCalled();
  });

  it('addTag returns early while another tag is being added', () => {
    component.newIncomeTag = 'Food';
    component.addingType = 'expense';
    component.addTag('income');
    expect(tagStub.addTag).not.toHaveBeenCalled();
  });

  it('addTag warns when no tag id is returned', () => {
    component.newIncomeTag = 'Food';
    component.addTag('income');
    addTagSubject.next('');
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Sign in before adding tags.',
      'error',
    );
  });

  it('addTag clears the input and notifies on success', () => {
    component.newExpenseTag = 'Transport';
    component.addTag('expense');
    addTagSubject.next('tag-1');
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Added Transport.',
      'success',
    );
    expect(component.newExpenseTag).toBe('');
  });

  it('addTag notifies on error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.newIncomeTag = 'Food';
    component.addTag('income');
    addTagSubject.error(new Error('boom'));
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Could not add the tag.',
      'error',
    );
    expect(component.addingType).toBeNull();
    consoleError.mockRestore();
  });

  it('addTag resets addingType on completion', () => {
    component.newIncomeTag = 'Food';
    component.addTag('income');
    addTagSubject.next('tag-1');
    addTagSubject.complete();
    expect(component.addingType).toBeNull();
  });

  it('confirmDeleteTag opens the confirmation dialog', () => {
    const tag: Tag = { id: 't1', name: 'Food', type: 'expense' };
    component.confirmDeleteTag(tag);
    expect(dialogStub.open).toHaveBeenCalled();
    const args = (dialogStub.open as any).mock.calls[0];
    expect(args[0]).toBe(ConfirmationDialogComponent);
    expect((args[1] as any).context.confirmLabel).toBe('Delete tag');
  });

  it('confirmDeleteTag onConfirm deletes the tag', () => {
    const tag: Tag = { id: 't1', name: 'Food', type: 'expense' };
    component.confirmDeleteTag(tag);
    const args = (dialogStub.open as any).mock.calls[0];
    (args[1] as any).context.onConfirm();
    expect(tagStub.deleteTag).toHaveBeenCalledWith('t1');
  });

  it('deleteTag notifies on success', () => {
    const tag: Tag = { id: 't1', name: 'Food', type: 'expense' };
    component['deleteTag'](tag);
    expect(tagStub.deleteTag).toHaveBeenCalledWith('t1');
    deleteTagSubject.next();
    deleteTagSubject.complete();
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Deleted Food.',
      'success',
    );
  });

  it('deleteTag notifies on error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tag: Tag = { id: 't1', name: 'Food', type: 'expense' };
    component['deleteTag'](tag);
    deleteTagSubject.error(new Error('boom'));
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Could not delete the tag.',
      'error',
    );
    expect(component.deletingTagId).toBeNull();
    consoleError.mockRestore();
  });

  it('deleteTag returns early when already deleting', () => {
    component.deletingTagId = 't2';
    component['deleteTag']({ id: 't1', name: 'Food', type: 'expense' });
    expect(tagStub.deleteTag).not.toHaveBeenCalled();
  });
});

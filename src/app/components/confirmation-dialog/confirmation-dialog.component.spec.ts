import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogContext,
} from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };
  let onConfirm = vi.fn();

  const context: ConfirmationDialogContext = {
    title: 'Delete transaction?',
    message: 'This transaction will be permanently deleted.',
    confirmLabel: 'Delete',
    destructive: true,
    onConfirm: () => onConfirm(),
  };

  beforeEach(async () => {
    onConfirm = vi.fn();
    dialogRefStub = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: dialogRefStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirm invokes onConfirm and closes with true', () => {
    component.confirm();
    expect(onConfirm).toHaveBeenCalled();
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('cancel closes with false', () => {
    component.cancel();
    expect(dialogRefStub.close).toHaveBeenCalledWith(false);
  });

  it('renders the context title and message', () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Delete transaction?');
    expect(html.textContent).toContain('This transaction will be permanently deleted.');
    expect(html.textContent).toContain('Delete');
  });

  it('clicking the cancel button closes with false', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelBtn = Array.from(buttons).find(
      (b) => (b as HTMLButtonElement).textContent?.trim() === 'Cancel',
    ) as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    expect(dialogRefStub.close).toHaveBeenCalledWith(false);
  });

  it('clicking the confirm button runs onConfirm and closes with true', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmBtn = Array.from(buttons).find(
      (b) => (b as HTMLButtonElement).textContent?.trim() === 'Delete',
    ) as HTMLButtonElement;
    expect(confirmBtn).toBeTruthy();
    confirmBtn.click();
    expect(onConfirm).toHaveBeenCalled();
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('renders fallback labels and the default variant when not provided', async () => {
    TestBed.resetTestingModule();
    const plainContext: ConfirmationDialogContext = {
      title: 'T',
      message: 'M',
      onConfirm: () => onConfirm(),
    };
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: plainContext },
        { provide: BrnDialogRef, useValue: dialogRefStub },
      ],
    }).compileComponents();

    const plainFixture = TestBed.createComponent(ConfirmationDialogComponent);
    plainFixture.detectChanges();
    const html = plainFixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Cancel');
    expect(html.textContent).toContain('Confirm');
    const confirmBtn = Array.from(html.querySelectorAll('button')).find(
      (b) => (b as HTMLButtonElement).textContent?.trim() === 'Confirm',
    ) as HTMLButtonElement;
    confirmBtn.click();
    expect(onConfirm).toHaveBeenCalled();
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { Subject } from 'rxjs';

import { TransactionFormComponent } from './transaction-form.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TransactionService } from '../../services/transactions/transaction.service';
import { NotificationService } from '../../services/notification/notification.service';
import { TagService } from '../../services/tags/tag.service';
import { Transaction } from '../../models/transaction.interface';
import {
  createHlmDialogServiceStub,
  createTagServiceStub,
} from '../../testing/service-stubs';

const selectedTransaction: Transaction = {
  id: 'tx-1',
  userId: 'user-1',
  title: 'Coffee',
  amount: 4.5,
  type: 'expense',
  description: 'Morning coffee',
  date: new Date(2024, 0, 5),
  tagIds: ['tag-1'],
};

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: ComponentFixture<TransactionFormComponent>;
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };
  let dialogServiceStub: ReturnType<typeof createHlmDialogServiceStub>;
  let transactionServiceStub: {
    addTransaction: ReturnType<typeof vi.fn>;
    updateTransaction: ReturnType<typeof vi.fn>;
    deleteTransaction: ReturnType<typeof vi.fn>;
  };
  let notificationStub: { show: ReturnType<typeof vi.fn> };
  let addSubject: Subject<any>;
  let updateSubject: Subject<any>;
  let deleteSubject: Subject<any>;

  async function configure(options?: { dialogData?: unknown }) {
    dialogRefStub = { close: vi.fn() };
    dialogServiceStub = createHlmDialogServiceStub();
    addSubject = new Subject();
    updateSubject = new Subject();
    deleteSubject = new Subject();
    transactionServiceStub = {
      addTransaction: vi.fn(() => addSubject.asObservable()),
      updateTransaction: vi.fn(() => updateSubject.asObservable()),
      deleteTransaction: vi.fn(() => deleteSubject.asObservable()),
    };
    notificationStub = { show: vi.fn() };
    const providers: any[] = [
      { provide: BrnDialogRef, useValue: dialogRefStub },
      { provide: HlmDialogService, useValue: dialogServiceStub },
      { provide: TransactionService, useValue: transactionServiceStub },
      { provide: NotificationService, useValue: notificationStub },
      { provide: TagService, useValue: createTagServiceStub() },
    ];
    if (options?.dialogData !== undefined) {
      providers.push({ provide: DIALOG_DATA, useValue: options.dialogData });
    }
    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await configure();
    expect(component).toBeTruthy();
  });

  it('initializes the form with default values for a new transaction', async () => {
    await configure();
    expect(component.transactionType).toBe('income');
    expect(component.selectedTransaction).toBeNull();
    const formValue = component.transactionForm.value;
    expect(formValue.type).toBe('income');
    expect(formValue.tagIds).toEqual([]);
  });

  it('uses the dialog context when present', async () => {
    await configure({
      dialogData: { transactionType: 'expense', selectedTransaction },
    });
    expect(component.transactionType).toBe('expense');
    expect(component.selectedTransaction).toEqual(selectedTransaction);
    expect(component.transactionForm.value.title).toBe('Coffee');
    expect(component.transactionForm.value.amount).toBe(4.5);
    expect(component.transactionForm.value.type).toBe('expense');
  });

  it('ngOnChanges handles transactionType changes', async () => {
    await configure();
    component.ngOnChanges({
      transactionType: {
        currentValue: 'expense',
        previousValue: 'income',
        firstChange: false,
        isFirstChange: () => false,
      } as any,
    });
    expect(component.transactionType).toBe('expense');
    expect(component.transactionForm.value.type).toBe('expense');
  });

  it('ngOnChanges handles selectedTransaction changes', async () => {
    await configure();
    component.ngOnChanges({
      selectedTransaction: {
        currentValue: selectedTransaction,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      } as any,
    });
    expect(component.selectedTransaction).toEqual(selectedTransaction);
    expect(component.transactionForm.value.title).toBe('Coffee');
  });

  it('formatDate returns the ISO date part', async () => {
    await configure();
    expect(component.formatDate(new Date(Date.UTC(2024, 0, 5)))).toBe(
      '2024-01-05',
    );
  });

  it('deleteConfirmation opens the confirmation dialog', async () => {
    await configure();
    component.selectedTransaction = selectedTransaction;
    component.deleteConfirmation();
    expect(dialogServiceStub.open).toHaveBeenCalled();
    const args = (dialogServiceStub.open as any).mock.calls[0];
    expect(args[0]).toBe(ConfirmationDialogComponent);
    expect((args[1] as any).context.onConfirm).toBeTypeOf('function');
    expect((args[1] as any).context.destructive).toBe(true);
  });

  it('deleteConfirmation onConfirm deletes the transaction', async () => {
    await configure();
    component.selectedTransaction = selectedTransaction;
    component.deleteConfirmation();
    const args = (dialogServiceStub.open as any).mock.calls[0];
    (args[1] as any).context.onConfirm();
    expect(transactionServiceStub.deleteTransaction).toHaveBeenCalledWith(
      selectedTransaction,
    );
  });

  it('deleteTransaction does nothing without a selected transaction', async () => {
    await configure();
    component.deleteTransaction();
    expect(transactionServiceStub.deleteTransaction).not.toHaveBeenCalled();
  });

  it('deleteTransaction notifies and closes on success', async () => {
    await configure();
    component.selectedTransaction = selectedTransaction;
    component.deleteTransaction();
    deleteSubject.next({});
    deleteSubject.complete();
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Transaction deleted.',
      'success',
    );
    expect(dialogRefStub.close).toHaveBeenCalled();
  });

  it('deleteTransaction notifies and resets on error', async () => {
    await configure();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.selectedTransaction = selectedTransaction;
    component.deleteTransaction();
    deleteSubject.error(new Error('boom'));
    expect(consoleError).toHaveBeenCalled();
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Could not delete the transaction.',
      'error',
    );
    expect(component.isDeleting).toBe(false);
    consoleError.mockRestore();
  });

  it('closeModal closes the dialog and resets the form', async () => {
    await configure();
    component.closeModal();
    expect(dialogRefStub.close).toHaveBeenCalled();
    expect(component.transactionForm.value.title).toBeNull();
  });

  it('updateTransactionTag clears tags when tag id is null', async () => {
    await configure();
    component.transactionForm.get('tagIds')?.setValue(['tag-1']);
    component.updateTransactionTag(null);
    expect(component.transactionForm.value.tagIds).toEqual([]);
  });

  it('updateTransactionTag sets a single tag id', async () => {
    await configure();
    component.updateTransactionTag('tag-9');
    expect(component.transactionForm.value.tagIds).toEqual(['tag-9']);
  });

  it('onSubmit marks fields touched and notifies when invalid', async () => {
    await configure();
    component.transactionForm.get('title')?.setValue('');
    component.onSubmit();
    expect(component.transactionForm.touched).toBe(true);
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Complete the required fields before saving.',
      'info',
    );
  });

  it('onSubmit adds a transaction on success', async () => {
    await configure();
    component.transactionForm.setValue({
      title: 'Salary',
      amount: 2000,
      type: 'income',
      description: 'Monthly',
      date: '2024-01-01',
      tagIds: [],
    });
    component.onSubmit();
    expect(transactionServiceStub.addTransaction).toHaveBeenCalled();
    addSubject.next({});
    addSubject.complete();
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Transaction added.',
      'success',
    );
    expect(dialogRefStub.close).toHaveBeenCalled();
  });

  it('onSubmit notifies on add error', async () => {
    await configure();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.transactionForm.setValue({
      title: 'Salary',
      amount: 2000,
      type: 'income',
      description: 'Monthly',
      date: '2024-01-01',
      tagIds: [],
    });
    component.onSubmit();
    addSubject.error(new Error('boom'));
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Could not add the transaction.',
      'error',
    );
    expect(component.isSaving).toBe(false);
    consoleError.mockRestore();
  });

  it('onSubmit updates a transaction on success', async () => {
    await configure();
    component.selectedTransaction = selectedTransaction;
    component.transactionForm.setValue({
      title: 'Coffee',
      amount: 5,
      type: 'expense',
      description: 'Latte',
      date: '2024-01-05',
      tagIds: ['tag-1'],
    });
    component.onSubmit();
    expect(transactionServiceStub.updateTransaction).toHaveBeenCalledWith(
      'tx-1',
      expect.objectContaining({ title: 'Coffee', amount: 5 }),
    );
    updateSubject.next({});
    updateSubject.complete();
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Transaction updated.',
      'success',
    );
    expect(dialogRefStub.close).toHaveBeenCalled();
  });

  it('onSubmit notifies on update error', async () => {
    await configure();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.selectedTransaction = selectedTransaction;
    component.transactionForm.setValue({
      title: 'Coffee',
      amount: 5,
      type: 'expense',
      description: 'Latte',
      date: '2024-01-05',
      tagIds: ['tag-1'],
    });
    component.onSubmit();
    updateSubject.error(new Error('boom'));
    expect(notificationStub.show).toHaveBeenCalledWith(
      'Could not update the transaction.',
      'error',
    );
    expect(component.isSaving).toBe(false);
    consoleError.mockRestore();
  });

  it('onSubmit returns early while saving', async () => {
    await configure();
    component.isSaving = true;
    component.onSubmit();
    expect(transactionServiceStub.addTransaction).not.toHaveBeenCalled();
  });

  it('onSubmit falls back to defaults for nullish form values', async () => {
    await configure();
    for (const key of ['title', 'amount', 'type', 'description', 'date', 'tagIds'] as const) {
      component.transactionForm.get(key)?.setValue(null);
      component.transactionForm.get(key)?.clearValidators();
      component.transactionForm.get(key)?.updateValueAndValidity();
    }
    component.onSubmit();
    expect(transactionServiceStub.addTransaction).toHaveBeenCalledWith({
      title: '',
      amount: 0,
      type: null,
      description: '',
      date: expect.any(Date),
      tagIds: [],
    });
  });

  it('isPost is true when no selected transaction', async () => {
    await configure();
    expect(component.isPost).toBe(true);
    component.selectedTransaction = selectedTransaction;
    expect(component.isPost).toBe(false);
  });
});

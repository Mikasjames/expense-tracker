import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable } from 'rxjs';

import { TransactionTableComponent } from './transaction-table.component';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { UtilService } from '../../services/util/util.service';
import { TagService } from '../../services/tags/tag.service';
import { TransactionService } from '../../services/transactions/transaction.service';
import { SettingsService } from '../../services/settings/settings.service';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { Transaction } from '../../models/transaction.interface';
import { createHlmDialogServiceStub, createUtilServiceStub } from '../../testing/service-stubs';

const transaction: Transaction = {
  id: 'tx-1',
  userId: 'user-1',
  title: 'Coffee',
  amount: 4.5,
  type: 'expense',
  description: 'Latte',
  date: new Date(2024, 0, 5),
  tagIds: ['tag-1'],
};

describe('TransactionTableComponent', () => {
  let component: TransactionTableComponent;
  let fixture: ComponentFixture<TransactionTableComponent>;
  let utilStub: ReturnType<typeof createUtilServiceStub>;
  let tagStub: {
    getTagFromId: ReturnType<typeof vi.fn>;
  };
  let transactionStub: {
    getTransactionFromId: ReturnType<typeof vi.fn>;
  };
  let settingsSubject: BehaviorSubject<any>;
  let settingsStub: {
    settings$: Observable<any>;
    format: ReturnType<typeof vi.fn>;
  };
  let dialogStub: ReturnType<typeof createHlmDialogServiceStub>;
  let gridApiMock: {
    refreshCells: ReturnType<typeof vi.fn>;
    setGridOption: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    utilStub = createUtilServiceStub();
    utilStub.formatDateToDayMonthYearWeekday.mockReturnValue('5 Jan 2024');
    tagStub = {
      getTagFromId: vi.fn(
        () => new BehaviorSubject({ name: 'Groceries' }).asObservable(),
      ),
    };
    transactionStub = { getTransactionFromId: vi.fn() };
    settingsSubject = new BehaviorSubject<any>({});
    settingsStub = {
      settings$: settingsSubject.asObservable(),
      format: vi.fn(() => '$4.50'),
    };
    dialogStub = createHlmDialogServiceStub();
    gridApiMock = {
      refreshCells: vi.fn(),
      setGridOption: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [TransactionTableComponent],
      providers: [
        { provide: UtilService, useValue: utilStub },
        { provide: TagService, useValue: tagStub },
        { provide: TransactionService, useValue: transactionStub },
        { provide: SettingsService, useValue: settingsStub },
        { provide: HlmDialogService, useValue: dialogStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onGridReady stores the grid api', () => {
    component.onGridReady({ api: gridApiMock } as any);
    component.filterTable('coffee');
    expect(gridApiMock.setGridOption).toHaveBeenCalledWith(
      'quickFilterText',
      'coffee',
    );
  });

  it('settings emission refreshes grid cells', () => {
    component.onGridReady({ api: gridApiMock } as any);
    settingsSubject.next({ currency: 'EUR' });
    expect(gridApiMock.refreshCells).toHaveBeenCalledWith({ force: true });
  });

  it('clears row data when transactions become empty', () => {
    component.transactions = [transaction];
    fixture.detectChanges();
    component.transactions = [];
    component.ngOnChanges();
    expect(component.rowData).toEqual([]);
  });

  it('maps transactions to row data', () => {
    component.transactions = [transaction];
    component.ngOnChanges();
    expect(component.rowData).toHaveLength(1);
    expect(component.rowData[0]).toEqual({
      id: 'tx-1',
      title: 'Coffee',
      date: '5 Jan 2024',
      description: 'Latte',
      category: 'Groceries',
      amount: 4.5,
      type: 'expense',
    });
    expect(tagStub.getTagFromId).toHaveBeenCalledWith('tag-1', 'expense');
  });

  it('applies the filter as the text changes', () => {
    component.onGridReady({ api: gridApiMock } as any);
    component.transactions = [transaction];
    component.ngOnChanges();
    component.filterText.setValue('coffee');
    expect(gridApiMock.setGridOption).toHaveBeenCalledWith(
      'quickFilterText',
      'coffee',
    );
  });

  it('clears the quick filter when the text is reset to null', () => {
    component.onGridReady({ api: gridApiMock } as any);
    component.transactions = [transaction];
    component.ngOnChanges();
    component.filterText.setValue(null);
    expect(gridApiMock.setGridOption).toHaveBeenCalledWith(
      'quickFilterText',
      '',
    );
  });

  it('opens the edit modal on row double click', () => {
    transactionStub.getTransactionFromId.mockReturnValue({
      ...transaction,
      type: 'income',
    });
    component.onRowDoubleClicked({
      data: { ...transaction, type: 'income' },
    } as any);
    expect(transactionStub.getTransactionFromId).toHaveBeenCalledWith(
      'tx-1',
      'income',
    );
    expect(component.selectedTransaction).toEqual({
      ...transaction,
      type: 'income',
    });
    expect(dialogStub.open).toHaveBeenCalledWith(TransactionFormComponent, {
      context: {
        transactionType: 'income',
        selectedTransaction: { ...transaction, type: 'income' },
      },
      contentClass: 'sm:max-w-4xl',
      showCloseButton: false,
    });
  });

  it('opens the modal with default type when no transaction is found', () => {
    transactionStub.getTransactionFromId.mockReturnValue(undefined);
    component.onRowDoubleClicked({
      data: { ...transaction, type: 'expense' },
    } as any);
    expect(component.selectedTransaction).toBeNull();
    expect(dialogStub.open).toHaveBeenCalledWith(TransactionFormComponent, {
      context: {
        transactionType: 'income',
        selectedTransaction: null,
      },
      contentClass: 'sm:max-w-4xl',
      showCloseButton: false,
    });
  });

  it('does nothing on double click without data', () => {
    component.onRowDoubleClicked({ data: undefined } as any);
    expect(transactionStub.getTransactionFromId).not.toHaveBeenCalled();
  });

  it('openModal opens the form with the selected transaction', () => {
    component.selectedTransaction = transaction;
    component.openModal('expense');
    expect(component.transactionType).toBe('expense');
    expect(dialogStub.open).toHaveBeenCalledWith(TransactionFormComponent, {
      context: {
        transactionType: 'expense',
        selectedTransaction: transaction,
      },
      contentClass: 'sm:max-w-4xl',
      showCloseButton: false,
    });
  });

  it('unsubscribes from settings on destroy', () => {
    component.ngOnDestroy();
    settingsSubject.next({ currency: 'GBP' });
    const calls = gridApiMock.refreshCells.mock.calls.length;
    settingsSubject.next({ currency: 'JPY' });
    expect(gridApiMock.refreshCells.mock.calls.length).toBe(calls);
  });

  it('formats amount cells using the settings service', () => {
    const amountCol = component.colDefs.find((c) => c.field === 'amount')!;
    const result = (amountCol.valueFormatter as any)({ value: 123.4 });
    expect(settingsStub.format).toHaveBeenCalledWith(123.4);
    expect(result).toBe('$4.50');
  });

  it('applies income and expense row styles', () => {
    const getRowStyle = component.gridOptions.getRowStyle!;
    const incomeStyle = getRowStyle({ data: { type: 'income' } } as any)!;
    expect(incomeStyle['backgroundColor']).toContain('34, 197, 94');
    const expenseStyle = getRowStyle({ data: { type: 'expense' } } as any)!;
    expect(expenseStyle['backgroundColor']).toContain('239, 68, 68');
  });
});

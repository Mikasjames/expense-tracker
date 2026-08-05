import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HlmDialogService } from '@spartan-ng/helm/dialog';

import { TransactionFormButtonsComponent } from './transaction-form-buttons.component';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { createHlmDialogServiceStub } from '../../testing/service-stubs';

describe('TransactionFormButtonsComponent', () => {
  let component: TransactionFormButtonsComponent;
  let fixture: ComponentFixture<TransactionFormButtonsComponent>;
  let dialogStub: ReturnType<typeof createHlmDialogServiceStub>;

  beforeEach(async () => {
    dialogStub = createHlmDialogServiceStub();
    await TestBed.configureTestingModule({
      imports: [TransactionFormButtonsComponent],
      providers: [{ provide: HlmDialogService, useValue: dialogStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults transaction type to income', () => {
    expect(component.transactionType).toBe('income');
  });

  it('openModal for income opens the transaction form', () => {
    component.openModal('income');
    expect(component.transactionType).toBe('income');
    expect(dialogStub.open).toHaveBeenCalledWith(TransactionFormComponent, {
      context: { transactionType: 'income', selectedTransaction: null },
      contentClass: 'sm:max-w-4xl',
      showCloseButton: false,
    });
  });

  it('openModal for expense opens the transaction form', () => {
    component.openModal('expense');
    expect(component.transactionType).toBe('expense');
    expect(dialogStub.open).toHaveBeenCalledWith(TransactionFormComponent, {
      context: { transactionType: 'expense', selectedTransaction: null },
      contentClass: 'sm:max-w-4xl',
      showCloseButton: false,
    });
  });
});

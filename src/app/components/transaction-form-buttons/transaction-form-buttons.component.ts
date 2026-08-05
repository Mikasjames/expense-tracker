import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';

@Component({
  selector: 'app-transaction-form-buttons',
  imports: [HlmButtonImports, NgIcon],
  templateUrl: './transaction-form-buttons.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './transaction-form-buttons.component.sass',
})
export class TransactionFormButtonsComponent {
  transactionType: 'income' | 'expense' = 'income';
  constructor(private dialogService: HlmDialogService) {}

  openModal(transactionType: 'income' | 'expense') {
    this.transactionType = transactionType;
    this.dialogService.open(TransactionFormComponent, {
      context: { transactionType, selectedTransaction: null },
      contentClass: 'sm:max-w-4xl',
      showCloseButton: false,
    });
  }
}
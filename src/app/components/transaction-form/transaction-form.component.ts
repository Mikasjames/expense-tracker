import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TransactionForm } from '../../models/transaction.interface';
import { TransactionService } from '../../services/transactions/transaction.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.sass',
})
export class TransactionFormComponent {
  @ViewChild('transactionModal', { static: true }) transactionModal:
    | TemplateRef<unknown>
    | undefined;
  transactionForm = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    type: ['income' as 'income' | 'expense', Validators.required],
    description: ['', Validators.required],
    date: [new Date(), Validators.required],
    tagIds: [[]],
  });
  transactionType: 'income' | 'expense' = 'income';

  constructor(
    private ngbModal: NgbModal,
    private fb: FormBuilder,
    private transactionService: TransactionService,
  ) {}

  openModal(transactionType: 'income' | 'expense') {
    this.ngbModal.open(this.transactionModal, {
      centered: true,
      fullscreen: 'sm',
    });
    (this.transactionForm.get('type') as FormControl<string>).setValue(
      transactionType,
    );
    this.transactionType = transactionType;
  }

  closeModal() {
    this.ngbModal.dismissAll();
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transaction: TransactionForm = {
        amount: formValue.amount ?? 0, // Provide a default value
        type: formValue.type as 'income' | 'expense',
        description: formValue.description ?? '',
        date: formValue.date ?? new Date(),
        tagIds: formValue.tagIds ?? [],
      };

      this.transactionService.addTransaction(transaction).subscribe({
        next: () => {
          console.log('Transaction added successfully');
        },
        error: (error) => {
          console.error('Error adding transaction', error);
        },
      });
      this.closeModal();
    } else {
      // Handle invalid form
      console.error('Form is invalid');
    }
  }
}

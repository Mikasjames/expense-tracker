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
import { TagInputComponent } from '../tag-input/tag-input.component';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TagInputComponent],
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
    tagIds: [[] as string[]],
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
    this.transactionForm.reset();
  }

  updateTransactionTag(tagId: string | null) {
    console.log('Tag ID:', tagId);
    if (!tagId) {
      this.transactionForm.get('tagIds')?.setValue([]);
      return;
    }
    const tagIds = this.transactionForm.get('tagIds')?.value as string[] | null;
    if (!tagIds) return;
    const updatedTagIds = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId];
    this.transactionForm.get('tagIds')?.setValue(updatedTagIds);
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transaction: TransactionForm = {
        amount: formValue.amount ?? 0, // Provide a default value
        type: formValue.type as 'income' | 'expense',
        description: formValue.description ?? '',
        date: new Date(formValue.date ?? new Date()), // Convert date string to Date object
        tagIds: formValue.tagIds ?? [],
      };
      console.log('Transaction:', transaction);
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

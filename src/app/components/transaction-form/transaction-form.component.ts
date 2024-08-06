import { Component, Input, SimpleChanges, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Transaction,
  TransactionForm,
} from '../../models/transaction.interface';
import { TransactionService } from '../../services/transactions/transaction.service';
import { TagInputComponent } from '../tag-input/tag-input.component';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TagInputComponent],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.sass',
})
export class TransactionFormComponent implements OnInit {
  transactionForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['income' as 'income' | 'expense', Validators.required],
    description: ['', Validators.required],
    date: ['', Validators.required], // Changed to string
    tagIds: [[] as string[]],
  });
  @Input() transactionType: 'income' | 'expense' = 'income';
  @Input() selectedTransaction: Transaction | null = null;

  constructor(
    private ngbModal: NgbModal,
    private fb: FormBuilder,
    private transactionService: TransactionService,
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['transactionType']) {
      this.transactionType = changes['transactionType'].currentValue;
      this.transactionForm.get('type')?.setValue(this.transactionType);
    }
    if (changes && changes['selectedTransaction']) {
      this.selectedTransaction = changes['selectedTransaction'].currentValue;
      this.initializeForm();
    }
  }

  initializeForm() {
    if (this.selectedTransaction) {
      this.transactionForm.patchValue({
        ...this.selectedTransaction,
        date: this.formatDate(new Date(this.selectedTransaction.date)),
      });
    } else {
      this.transactionForm.patchValue({
        amount: null,
        type: this.transactionType,
        description: '',
        date: this.formatDate(new Date()),
        tagIds: [],
      });
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  parseDate(dateString: string): Date {
    return new Date(dateString);
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
        amount: formValue.amount ?? 0,
        type: formValue.type as 'income' | 'expense',
        description: formValue.description ?? '',
        date: this.parseDate(formValue.date ?? ''),
        tagIds: formValue.tagIds ?? [],
      };

      if (this.selectedTransaction) {
        // Update existing transaction
        this.transactionService
          .updateTransaction(this.selectedTransaction.id, transaction)
          .subscribe({
            next: () => {
              console.log('Transaction updated successfully');
            },
            error: (error) => {
              console.error('Error updating transaction', error);
            },
          });
      } else {
        // Add new transaction
        this.transactionService.addTransaction(transaction).subscribe({
          next: () => {
            console.log('Transaction added successfully');
          },
          error: (error) => {
            console.error('Error adding transaction', error);
          },
        });
      }
      this.closeModal();
    } else {
      console.error('Form is invalid');
    }
  }

  get isPost() {
    return this.selectedTransaction === null;
  }
}

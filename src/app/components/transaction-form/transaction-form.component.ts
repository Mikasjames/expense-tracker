import {
  Component,
  Input,
  SimpleChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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
  @ViewChild('deleteConfirmationModal') deleteConfirmationModal!: NgbModal;
  transactionForm = this.fb.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: ['income' as 'income' | 'expense', Validators.required],
    description: [''],
    date: ['', Validators.required], // Changed to string
    tagIds: [[] as string[]],
  });
  @Input() transactionType: 'income' | 'expense' = 'income';
  @Input() selectedTransaction: Transaction | null = null;
  deleteConfirmationModalReference!: NgbModalRef;

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

  deleteConfirmation() {
    this.deleteConfirmationModalReference = this.ngbModal.open(
      this.deleteConfirmationModal,
      {
        centered: true,
        backdrop: true,
        size: 'sm',
      },
    );
  }

  closeDeleteConfirmation() {
    this.deleteConfirmationModalReference.close();
  }

  deleteTransaction() {
    if (this.selectedTransaction) {
      this.transactionService
        .deleteTransaction(this.selectedTransaction)
        .subscribe({
          next: () => {
            console.log('Transaction deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting transaction', error);
          },
        });
    }
    this.closeModal();
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
    this.transactionForm.get('tagIds')?.setValue([tagId]);
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const transaction: TransactionForm = {
        title: formValue.title ?? '',
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

import {
  Component,
  SimpleChanges,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmDialogService, HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { NgIcon } from '@ng-icons/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Transaction,
  TransactionForm,
} from '../../models/transaction.interface';
import { TransactionService } from '../../services/transactions/transaction.service';
import { TagInputComponent } from '../tag-input/tag-input.component';

interface TransactionFormContext {
  transactionType: 'income' | 'expense';
  selectedTransaction: Transaction | null;
}

@Component({
  selector: 'app-transaction-form',
  imports: [
    ReactiveFormsModule,
    TitleCasePipe,
    NgIcon,
    HlmDialogImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTextareaImports,
    TagInputComponent,
  ],
  templateUrl: './transaction-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './transaction-form.component.sass',
})
export class TransactionFormComponent implements OnInit {
  transactionForm = this.fb.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    type: ['income' as 'income' | 'expense', Validators.required],
    description: [''],
    date: ['', Validators.required],
    tagIds: [[] as string[]],
  });
  transactionType: 'income' | 'expense' = 'income';
  selectedTransaction: Transaction | null = null;
  private readonly dialogContext =
    injectBrnDialogContext<TransactionFormContext | null>({ optional: true });
  private readonly dialogRef = inject(BrnDialogRef, { optional: true });
  private readonly dialogService = inject(HlmDialogService);

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
  ) {}

  ngOnInit() {
    this.transactionType =
      this.dialogContext?.transactionType ?? this.transactionType;
    this.selectedTransaction =
      this.dialogContext?.selectedTransaction ?? this.selectedTransaction;
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
    this.dialogService.open(DeleteConfirmationDialogComponent, {
      context: {
        message: 'Are you sure you want to delete this transaction?',
        onConfirm: () => this.deleteTransaction(),
      },
      contentClass: 'sm:max-w-lg',
    });
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
    this.dialogRef?.close();
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

interface DeleteConfirmationContext {
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  imports: [HlmButtonImports, HlmDialogImports, NgIcon],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Delete Confirmation</h3>
      <p hlmDialogDescription class="text-muted-foreground text-sm mb-3">
        {{ context?.message ?? 'Are you sure you want to delete this item?' }}
      </p>
    </hlm-dialog-header>
    <div class="flex justify-end gap-2">
      <button
        hlmBtn
        variant="outline"
        class="text-muted-foreground"
        (click)="cancel()"
      >
        {{ context?.cancelLabel ?? 'Cancel' }}
      </button>
      <button hlmBtn variant="destructive" (click)="confirm()">
        <ng-icon name="lucideTrash2" class="mr-2" />
        {{ context?.confirmLabel ?? 'Delete' }}
      </button>
    </div>
  `,
})
export class DeleteConfirmationDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef);
  readonly context =
    injectBrnDialogContext<DeleteConfirmationContext | null>({ optional: true });

  confirm() {
    this.context?.onConfirm?.();
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.dismiss('outside');
  }
}
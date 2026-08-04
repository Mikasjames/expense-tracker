import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridOptions,
  GridApi,
  GridReadyEvent,
  RowDoubleClickedEvent,
} from 'ag-grid-community';
import { Transaction } from '../../models/transaction.interface';
import { UtilService } from '../../services/util/util.service';
import { TagService } from '../../services/tags/tag.service';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transactions/transaction.service';
import { SettingsService } from '../../services/settings/settings.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-transaction-table',
  imports: [AgGridAngular, ReactiveFormsModule, HlmInputImports],
  templateUrl: './transaction-table.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './transaction-table.component.css',
})
export class TransactionTableComponent {
  private gridApi!: GridApi;
  @Input() transactions: Transaction[] = [];
  @Input() showFilter = false;
  filterText = new FormControl('');
  rowData: TransactionRowData[] = [];
  colDefs: ColDef[] = [
    { field: 'title' },
    {
      field: 'amount',
      valueFormatter: (params) => this.settingsService.format(params.value),
    },
    { field: 'date' },
    { field: 'category' },
    { field: 'description' },
    { field: 'type' },
  ];
  gridOptions: GridOptions = {
    getRowStyle: (params) => {
      const isIncome = params.data.type === 'income';
      return isIncome
        ? { backgroundColor: 'rgba(34, 197, 94, 0.08)' }
        : { backgroundColor: 'rgba(239, 68, 68, 0.08)' };
    },
  };
  selectedTransaction: Transaction | null = null;
  transactionType: 'income' | 'expense' = 'income';
  private settingsSubscription: any;

  constructor(
    private utilService: UtilService,
    private tagService: TagService,
    private transactionService: TransactionService,
    private dialogService: HlmDialogService,
    private settingsService: SettingsService,
  ) {
    this.settingsSubscription = this.settingsService.settings$.subscribe(() => {
      this.gridApi?.refreshCells({ force: true });
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  ngOnChanges() {
    if (this.transactions.length === 0) {
      this.rowData = [];
    }
    this.transactionToRowData(this.transactions).subscribe((rowData) => {
      this.rowData = rowData;
      this.filterText.valueChanges.subscribe((value) => {
        this.filterTable(value ?? '');
      });
    });
  }

  onRowDoubleClicked(event: RowDoubleClickedEvent<TransactionRowData>) {
    if (event.data) {
      const selectedTransaction = this.transactionService.getTransactionFromId(
        event.data.id,
        event.data.type === 'income' ? 'income' : 'expense',
      );
      this.selectedTransaction = selectedTransaction ?? null;
      this.openModal(selectedTransaction ? selectedTransaction.type : 'income');
    }
  }

  transactionToRowData(
    transactions: Transaction[],
  ): Observable<TransactionRowData[]> {
    const rowDataObservables = transactions.map((transaction) =>
      this.tagService
        .getTagFromId(transaction.tagIds[0], transaction.type)
        .pipe(
          map((tag) => ({
            id: transaction.id,
            title: transaction.title,
            date: this.utilService.formatDateToDayMonthYearWeekday(
              transaction.date,
            ),
            description: transaction.description,
            category: tag.name,
            amount: transaction.amount,
            type: transaction.type,
          })),
        ),
    );

    return combineLatest(rowDataObservables);
  }

  filterTable(text: string) {
    this.gridApi.setGridOption('quickFilterText', text);
  }

  openModal(transactionType: 'income' | 'expense') {
    this.transactionType = transactionType;
    this.dialogService.open(TransactionFormComponent, {
      context: {
        transactionType,
        selectedTransaction: this.selectedTransaction,
      },
      contentClass: 'sm:max-w-lg',
    });
  }

  ngOnDestroy() {
    this.settingsSubscription?.unsubscribe();
  }
}

interface TransactionRowData {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

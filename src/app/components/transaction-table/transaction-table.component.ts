import { Component, Input, ViewChild } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transactions/transaction.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [
    AgGridAngular,
    CommonModule,
    ReactiveFormsModule,
    TransactionFormComponent,
  ],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.css',
})
export class TransactionTableComponent {
  @ViewChild('modalTemplate') modalTemplate!: TransactionFormComponent;
  private gridApi!: GridApi;
  @Input() transactions: Transaction[] = [];
  @Input() showFilter = false;
  filterText = new FormControl('');
  rowData: TransactionRowData[] = [];
  colDefs: ColDef[] = [
    { field: 'description' },
    { field: 'amount' },
    { field: 'date' },
    { field: 'type' },
    { field: 'category' },
  ];
  gridOptions: GridOptions = {
    getRowStyle: (params) => {
      const isIncome = params.data.type === 'income';
      const oddRow = (params.node.rowIndex ?? 0) % 2 === 0;
      return isIncome
        ? { backgroundColor: oddRow ? '#e6f3e6' : '#f0f8f0' }
        : { backgroundColor: oddRow ? '#fce4e4' : '#fdf0f0' };
    },
  };
  selectedTransaction: Transaction | null = null;
  transactionType: 'income' | 'expense' = 'income';

  constructor(
    private utilService: UtilService,
    private tagService: TagService,
    private transactionService: TransactionService,
    private ngbModal: NgbModal,
  ) {}

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  ngOnChanges() {
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
    this.ngbModal.open(this.modalTemplate, {
      centered: true,
      fullscreen: 'sm',
    });
  }
}

interface TransactionRowData {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

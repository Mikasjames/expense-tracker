import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridOptions,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import { Transaction } from '../../models/transaction.interface';
import { UtilService } from '../../services/util/util.service';
import { TagService } from '../../services/tags/tag.service';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [AgGridAngular, CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.css',
})
export class TransactionTableComponent {
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

  constructor(
    private utilService: UtilService,
    private tagService: TagService,
  ) {}

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  ngOnChanges() {
    this.rowData = this.transactionToRowData(this.transactions);
    this.filterText.valueChanges.subscribe((value) => {
      this.filterTable(value ?? '');
    });
  }

  transactionToRowData(transaction: Transaction[]): TransactionRowData[] {
    return transaction.map((transaction) => ({
      date: this.utilService.formatDateToDayMonthYearWeekday(transaction.date),
      description: transaction.description,
      category: transaction.tagIds[0],
      amount: transaction.amount,
      type: transaction.type,
    }));
  }

  filterTable(text: string) {
    this.gridApi.setGridOption('quickFilterText', text);
  }
}

interface TransactionRowData {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

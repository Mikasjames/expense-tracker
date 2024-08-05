import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, RowClassRules, GridOptions } from 'ag-grid-community';
import { Transaction } from '../../models/transaction.interface';
import { UtilService } from '../../services/util/util.service';
import { TagService } from '../../services/tags/tag.service';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.css',
})
export class TransactionTableComponent {
  @Input() transactions: Transaction[] = [];
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

  ngOnChanges() {
    this.rowData = this.transactionToRowData(this.transactions);
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
}

interface TransactionRowData {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

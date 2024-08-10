import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { UserInterface } from '../../models/user.interface';
import { TransactionService } from '../../services/transactions/transaction.service';
import { Transaction } from '../../models/transaction.interface';
import { CommonModule } from '@angular/common';
import { LineBarChartComponent } from '../../components/line-bar-chart/line-bar-chart.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { LineBarData } from '../../models/chart.interface';
import { LoaderComponent } from '../../components/loader/loader.component';
import { TransactionTableComponent } from '../../components/transaction-table/transaction-table.component';
import { combineLatest, finalize, Subject, takeUntil, tap } from 'rxjs';
import { TransactionFormButtonsComponent } from '../../components/transaction-form-buttons/transaction-form-buttons.component';
import { DateSelectorComponent } from '../../components/date-selector/date-selector.component';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    LineBarChartComponent,
    StatCardComponent,
    TransactionFormComponent,
    LoaderComponent,
    TransactionTableComponent,
    TransactionFormButtonsComponent,
    DateSelectorComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.sass',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  statCards = [
    { title: 'In', value: 0, percentChange: 0, isIncome: true },
    { title: 'Out', value: 0, percentChange: 0, isIncome: false },
    { title: 'On Hand', value: 0, percentChange: 0, isIncome: true },
  ];
  allTransactions: Transaction[] = [];
  incomeLineBarData: LineBarData[] = [];
  expenseLineBarData: LineBarData[] = [];
  showDateSelector = false;
  dateSelectorClicked = false;
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectorService: DateSelectorService,
    private renderer: Renderer2,
  ) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (!this.dateSelectorClicked) {
        this.showDateSelector = false;
      }
      this.dateSelectorClicked = false;
    });
  }

  ngOnInit() {
    this.initializeData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData() {
    combineLatest([
      this.transactionService.expenseTransactions$,
      this.transactionService.incomeTransactions$,
      this.dateSelectorService.dateRange$,
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([expenses, income, dateRange]) => ({
          expenses: this.filterTransactionsByDateRange(expenses, dateRange),
          income: this.filterTransactionsByDateRange(income, dateRange),
        })),
      )
      .subscribe(
        ({ expenses, income }) => {
          this.updateDashboard(expenses, income);
          this.showDateSelector = false;
          this.isLoading = false;
        },
        (error) => console.error('Error fetching transactions:', error),
      );
  }

  private filterTransactionsByDateRange(
    transactions: Transaction[],
    dateRange: { from: Date; to: Date } | null,
  ): Transaction[] {
    if (!dateRange || !dateRange.from || !dateRange.to) return transactions;
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return transactions.filter(
      (transaction) =>
        new Date(transaction.date) >= dateRange.from! &&
        new Date(transaction.date) <= to,
    );
  }

  private updateDashboard(expenses: Transaction[], income: Transaction[]) {
    this.updateStatCard(income, 0);
    this.updateStatCard(expenses, 1);
    this.calculateNetIncome(income, expenses);

    this.incomeLineBarData = this.convertTransactionsToLineBarData(income);
    this.expenseLineBarData = this.convertTransactionsToLineBarData(expenses);

    this.allTransactions = this.combineAndSortTransactions(income, expenses);
  }

  private updateStatCard(transactions: Transaction[], index: number) {
    if (transactions.length === 0) {
      this.statCards[index].value = 0;
      this.statCards[index].percentChange = 0;
      return;
    }
    this.statCards[index].value = this.aggregateTransactions(transactions);
    this.statCards[index].percentChange = this.calculatePercentChange(
      transactions[transactions.length - 1].amount,
      transactions[0].amount,
    );
  }

  private calculateNetIncome(income: Transaction[], expenses: Transaction[]) {
    const currentIncome = this.aggregateTransactions(income);
    const currentExpenses = this.aggregateTransactions(expenses);
    const currentNet = currentIncome - currentExpenses;

    const firstIncome = income.length > 0 ? income[0].amount : 0;
    const firstExpense = expenses.length > 0 ? expenses[0].amount : 0;
    const firstNet = firstIncome - firstExpense;

    this.statCards[2].value = currentNet;
    this.statCards[2].percentChange = this.calculatePercentChange(
      currentNet,
      firstNet,
    );
  }

  private aggregateTransactions(transactions: Transaction[]): number {
    return Math.round(
      transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
    );
  }

  private calculatePercentChange(current: number, previous: number): number {
    return previous !== 0
      ? ((current - previous) / Math.abs(previous)) * 100
      : 0;
  }

  private convertTransactionsToLineBarData(
    transactions: Transaction[],
  ): LineBarData[] {
    return transactions.map((transaction) => ({
      tag: transaction.tagIds[0],
      value: [new Date(transaction.date).getTime(), transaction.amount],
      title: transaction.title,
    }));
  }

  private combineAndSortTransactions(
    income: Transaction[],
    expenses: Transaction[],
  ): Transaction[] {
    return [...income, ...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  toggleDateSelector() {
    this.showDateSelector = !this.showDateSelector;
  }

  preventCloseOnClick() {
    this.dateSelectorClicked = true;
  }
}

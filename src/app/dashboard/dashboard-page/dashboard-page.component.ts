import { Component } from '@angular/core';
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
import { combineLatest, finalize, tap } from 'rxjs';
import { TransactionFormButtonsComponent } from '../../components/transaction-form-buttons/transaction-form-buttons.component';
import { DateSelectorComponent } from '../../components/date-selector/date-selector.component';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';

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
export class DashboardPageComponent {
  userInfo = {} as UserInterface;
  statCards = [
    { title: 'In', value: 0, percentChange: 0, isIncome: true },
    { title: 'Out', value: 0, percentChange: 0, isIncome: false },
    { title: 'On Hand', value: 0, percentChange: 0, isIncome: true },
  ];
  income: Transaction[] = [];
  expenses: Transaction[] = [];
  allTransactions: Transaction[] = [];
  filteredIncome: Transaction[] = [];
  filteredExpenses: Transaction[] = [];
  incomeLineBarData: LineBarData[] = [];
  expenseLineBarData: LineBarData[] = [];
  from: Date | null = null;
  to: Date | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private dateSelectorService: DateSelectorService,
  ) {
    const user = this.authService.currentUserSig();
    if (user) {
      this.userInfo = user;
    }
    this.dateSelectorService.dateRange$.subscribe((dateRange) => {
      if (dateRange && dateRange.from && dateRange.to) {
        this.from = dateRange.from;
        this.to = dateRange.to;
        this.to.setHours(23, 59, 59, 999);
      } else {
        this.from = null;
        this.to = null;
      }
      this.handleExpenseTransactions(this.expenses);
      this.handleIncomeTransactions(this.income);
    });
  }

  ngOnInit() {
    this.allTransactions = [];
    combineLatest([
      this.transactionService.expenseTransactions$,
      this.transactionService.incomeTransactions$,
    ])
      .pipe(
        tap(() => {
          setTimeout(() => {
            this.isLoading = false;
          }, 1000);
        }),
      )
      .subscribe(
        ([expenseTransactions, incomeTransactions]) => {
          this.handleExpenseTransactions(expenseTransactions);
          this.handleIncomeTransactions(incomeTransactions);
        },
        (error) => {
          console.error('Error fetching transactions:', error);
        },
      );
  }

  handleExpenseTransactions(transactions: Transaction[]) {
    if (transactions.length === 0) return;
    this.expenses = transactions;
    if (this.from && this.to) {
      transactions = transactions.filter((transaction) => {
        return (
          new Date(transaction.date) >= this.from! &&
          new Date(transaction.date) <= this.to!
        );
      });
    }
    this.filteredExpenses = transactions;
    console.log('transactions:', transactions);
    this.expenseLineBarData =
      this.convertTransactionsToLineBarData(transactions);
    this.calculateStatcardData(transactions, 1);
    this.allTransactions = this.combineAndSortTransactions(
      this.filteredIncome,
      this.filteredExpenses,
    );
  }

  handleIncomeTransactions(transactions: Transaction[]) {
    if (transactions.length === 0) return;
    this.income = transactions;
    if (this.from && this.to) {
      transactions = transactions.filter((transaction) => {
        return (
          new Date(transaction.date) >= this.from! &&
          new Date(transaction.date) <= this.to!
        );
      });
    }
    this.filteredIncome = transactions;
    console.log('transactions:', transactions);
    this.incomeLineBarData =
      this.convertTransactionsToLineBarData(transactions);
    this.calculateStatcardData(transactions, 0);
    this.allTransactions = this.combineAndSortTransactions(
      this.filteredIncome,
      this.filteredExpenses,
    );
  }

  calculateStatcardData(transactions: Transaction[], index: number) {
    if (transactions.length === 0) {
      this.statCards[index].value = 0;
      this.statCards[index].percentChange = 0;
      return;
    }
    this.statCards[index].value = this.aggregateTransactions(transactions);
    this.statCards[index].percentChange = this.calculatePercentChange(
      transactions.slice(-1)[0].amount,
      transactions[0].amount,
    );
    this.calculateNetIncome();
  }

  combineAndSortTransactions(
    income: Transaction[],
    expenses: Transaction[],
  ): Transaction[] {
    const combinedTransactions = [...income, ...expenses];
    combinedTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return combinedTransactions;
  }

  calculateNetIncome() {
    if (this.income.length === 0 || this.expenses.length === 0) return;
    this.statCards[2].value = this.statCards[0].value - this.statCards[1].value;
    const firstIncome = this.income[0].amount;
    const firstExpense = this.expenses[0].amount;
    const lastIncome = this.income.slice(-1)[0].amount;
    const lastExpense = this.expenses.slice(-1)[0].amount;
    this.statCards[2].percentChange = this.calculatePercentChange(
      lastIncome - lastExpense,
      firstIncome - firstExpense,
    );
  }

  aggregateTransactions(transactions: Transaction[]): number {
    return Math.round(
      transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
    );
  }

  calculatePercentChange(current: number, previous: number): number {
    return ((current - previous) / previous) * 100;
  }

  convertTransactionsToLineBarData(transactions: Transaction[]): LineBarData[] {
    return transactions.map((transaction) => {
      return {
        tag: transaction.tagIds[0],
        value: [transaction.date.getTime(), transaction.amount],
        title: transaction.title,
      };
    });
  }
}

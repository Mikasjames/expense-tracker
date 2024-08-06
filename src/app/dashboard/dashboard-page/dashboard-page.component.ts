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
  incomeLineBarData: LineBarData[] = [];
  expenseLineBarData: LineBarData[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
  ) {
    const user = this.authService.currentUserSig();
    if (user) {
      this.userInfo = user;
    }
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
    console.log('transactions:', transactions);
    this.expenses = transactions;
    this.expenseLineBarData =
      this.convertTransactionsToLineBarData(transactions);
    this.calculateStatcardData(transactions, 1);
    this.allTransactions = this.combineAndSortTransactions(
      this.income,
      this.expenses,
    );
  }

  handleIncomeTransactions(transactions: Transaction[]) {
    if (transactions.length === 0) return;
    console.log('transactions:', transactions);
    this.income = transactions;
    this.incomeLineBarData =
      this.convertTransactionsToLineBarData(transactions);
    this.calculateStatcardData(transactions, 0);
    this.allTransactions = this.combineAndSortTransactions(
      this.income,
      this.expenses,
    );
  }

  calculateStatcardData(transactions: Transaction[], index: number) {
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

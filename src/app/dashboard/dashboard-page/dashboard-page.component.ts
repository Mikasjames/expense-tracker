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
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.sass',
})
export class DashboardPageComponent {
  userInfo = {} as UserInterface;
  statCards = [
    { title: 'Income', value: 0, percentChange: 0, isIncome: true },
    { title: 'Expense', value: 0, percentChange: 0, isIncome: false },
    { title: 'Net', value: 0, percentChange: 0, isIncome: true },
  ];
  income: Transaction[] = [];
  expenses: Transaction[] = [];
  allTransactions: Transaction[] = [];
  incomeLineBarData: LineBarData[] = [];
  expenseLineBarData: LineBarData[] = [];

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
    this.loadExpenseTransactions();
    this.loadIncomeTransactions();
  }

  loadExpenseTransactions() {
    this.transactionService.expenseTransactions$.subscribe(
      (transactions) => {
        this.expenses = transactions;
        this.expenseLineBarData =
          this.convertTransactionsToLineBarData(transactions);
        this.calculateStatcardData(transactions, 1);
        this.allTransactions = this.combineAndSortTransactions(
          this.income,
          this.expenses,
        );
      },
      (error) => {
        console.error('Error fetching expense transactions:', error);
      },
    );
  }

  loadIncomeTransactions() {
    this.transactionService.incomeTransactions$.subscribe(
      (transactions) => {
        this.income = transactions;
        this.incomeLineBarData =
          this.convertTransactionsToLineBarData(transactions);
        this.calculateStatcardData(transactions, 0);
        this.allTransactions = this.combineAndSortTransactions(
          this.income,
          this.expenses,
        );
      },
      (error) => {
        console.error('Error fetching income transactions:', error);
      },
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
    return transactions.reduce(
      (acc, transaction) => acc + transaction.amount,
      0,
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
        title: transaction.description,
      };
    });
  }
}

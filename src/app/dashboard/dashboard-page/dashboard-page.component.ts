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
    { title: 'Income', value: 0, percentChange: 0 },
    { title: 'Expense', value: 0, percentChange: 0 },
    { title: 'Net', value: 0, percentChange: 0 },
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
        this.statCards[1].value = this.aggregateTransactions(transactions);
        this.calculateNetIncome();
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
        this.statCards[0].value = this.aggregateTransactions(transactions);
        this.calculateNetIncome();
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
  }

  aggregateTransactions(transactions: Transaction[]): number {
    return transactions.reduce(
      (acc, transaction) => acc + transaction.amount,
      0,
    );
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

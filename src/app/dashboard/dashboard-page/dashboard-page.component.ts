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
import { TagService } from '../../services/tags/tag.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    LineBarChartComponent,
    StatCardComponent,
    TransactionFormComponent,
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
  incomeLineBarData: LineBarData[] = [];
  expenseLineBarData: LineBarData[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private tagService: TagService,
  ) {
    const user = this.authService.currentUserSig();
    if (user) {
      this.userInfo = user;
      this.loadIncomeTransactions();
      this.loadExpenseTransactions();
    }
  }

  loadExpenseTransactions() {
    this.transactionService.expenseTransactions$.subscribe(
      (transactions) => {
        this.expenses = transactions;
        this.expenseLineBarData = this.convertTransactionsToLineBarData(
          transactions,
          'expense',
        );
        console.log('Expense Transactions:', transactions);
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
        this.incomeLineBarData = this.convertTransactionsToLineBarData(
          transactions,
          'income',
        );
        console.log('Income Transactions:', transactions);
      },
      (error) => {
        console.error('Error fetching income transactions:', error);
      },
    );
  }

  convertTransactionsToLineBarData(
    transactions: Transaction[],
    transactionType: 'expense' | 'income',
  ): LineBarData[] {
    return transactions.map((transaction) => {
      return {
        tag: this.tagService.getTagFromId(
          transaction.tagIds[0],
          transactionType,
        ).name,
        value: [transaction.date, transaction.amount],
        title: transaction.description,
      };
    });
  }
}

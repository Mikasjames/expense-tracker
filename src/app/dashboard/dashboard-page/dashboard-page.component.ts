import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { UserInterface } from '../../models/user.interface';
import { TransactionService } from '../../services/transactions/transaction.service';
import { Transaction } from '../../models/transaction.interface';
import { CommonModule } from '@angular/common';
import { LineBarChartComponent } from '../../components/line-bar-chart/line-bar-chart.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';

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
  constructor(private authService: AuthService) {
    const user = this.authService.currentUserSig();
    if (user) {
      this.userInfo = user;
    }
  }
}

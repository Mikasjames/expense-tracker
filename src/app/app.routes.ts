import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard, PublicOnlyGuard } from './services/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardPageComponent } from './dashboard/dashboard-page/dashboard-page.component';

const dashboardChildRoutes: Routes = [
  { path: '', component: DashboardPageComponent },
];

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [PublicOnlyGuard] },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [PublicOnlyGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: dashboardChildRoutes,
  },
];

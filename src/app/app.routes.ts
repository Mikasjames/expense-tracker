import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import {
  AdminOnlyGuard,
  AuthGuard,
  PublicOnlyGuard,
} from './services/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardPageComponent } from './dashboard/dashboard-page/dashboard-page.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { FormFillerComponent } from './form-filler/form-filler.component';

const dashboardChildRoutes: Routes = [
  { path: '', component: DashboardPageComponent },
  {
    path: 'fill-form',
    component: FormFillerComponent,
    canActivate: [AdminOnlyGuard],
  },
];

export const routes: Routes = [
  { path: '', component: LandingPageComponent, canActivate: [PublicOnlyGuard] },
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

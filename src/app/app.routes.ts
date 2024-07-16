import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { PublicOnlyGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [PublicOnlyGuard] },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [PublicOnlyGuard],
  },
];

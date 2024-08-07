import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
class AuthGuardService {
  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  canActivate(): ReturnType<CanActivateFn> {
    return authState(this.auth).pipe(
      take(1),
      map((user) => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      }),
    );
  }
}

@Injectable({
  providedIn: 'root',
})
class PublicOnlyGuardService {
  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  canActivate(): ReturnType<CanActivateFn> {
    return authState(this.auth).pipe(
      take(1),
      map((user) => {
        if (user) {
          this.router.navigate(['/dashboard']);
          return false;
        } else {
          return true;
        }
      }),
    );
  }
}

@Injectable({
  providedIn: 'root',
})
class AdminOnlyGuardService {
  constructor(
    private auth: Auth,
    private router: Router,
    private authService: AuthService,
  ) {}

  canActivate(): ReturnType<CanActivateFn> {
    return combineLatest([
      authState(this.auth),
      this.authService.isAdmin(),
    ]).pipe(
      take(1),
      map(([user, isAdmin]) => {
        if (user && isAdmin) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      }),
    );
  }
}

export const AuthGuard: CanActivateFn = (route, state) => {
  return inject(AuthGuardService).canActivate();
};

export const PublicOnlyGuard: CanActivateFn = (route, state) => {
  return inject(PublicOnlyGuardService).canActivate();
};

export const AdminOnlyGuard: CanActivateFn = (route, state) => {
  return inject(AdminOnlyGuardService).canActivate();
};

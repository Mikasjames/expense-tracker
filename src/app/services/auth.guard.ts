import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

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
          this.router.navigate(['/']);
          return false;
        } else {
          return true;
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

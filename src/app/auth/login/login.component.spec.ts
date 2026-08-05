import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth/auth.service';
import { PlatformService } from '../../services/platform/platform.service';
import { createRouterStub } from '../../testing/service-stubs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let routerStub: ReturnType<typeof createRouterStub>;
  let loginSubject: Subject<any>;
  let authStub: { login: ReturnType<typeof vi.fn> };
  let platformStub: { isBrowser: ReturnType<typeof vi.fn> };

  async function configure(isBrowser = true) {
    routerStub = createRouterStub();
    loginSubject = new Subject();
    authStub = { login: vi.fn(() => loginSubject.asObservable()) };
    platformStub = { isBrowser: vi.fn(() => isBrowser) };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authStub },
        { provide: PlatformService, useValue: platformStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await configure();
    expect(component).toBeTruthy();
  });

  it('is not loading in the browser', async () => {
    await configure();
    expect(component.isLoading).toBe(false);
  });

  it('stays loading on the server', async () => {
    await configure(false);
    expect(component.isLoading).toBe(true);
  });

  it('navigates to the dashboard on successful login', async () => {
    await configure();
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret' });
    component.login();
    expect(component.isLoading).toBe(true);
    expect(authStub.login).toHaveBeenCalledWith('a@b.com', 'secret');
    loginSubject.next({});
    loginSubject.complete();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.isLoading).toBe(false);
  });

  it('stores the error message on login failure', async () => {
    await configure();
    component.login();
    loginSubject.error({ message: 'invalid credentials' });
    expect(component.error).toBe('invalid credentials');
    expect(component.isLoading).toBe(false);
    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('navigates to the register page', async () => {
    await configure();
    component.navigateToRegister();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/register');
  });
});

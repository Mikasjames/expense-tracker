import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth/auth.service';
import { createRouterStub } from '../../testing/service-stubs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let routerStub: ReturnType<typeof createRouterStub>;
  let registerSubject: Subject<any>;
  let authStub: { register: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerStub = createRouterStub();
    registerSubject = new Subject();
    authStub = { register: vi.fn(() => registerSubject.asObservable()) };
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('registers and navigates to login', () => {
    component.registerForm.setValue({
      email: 'a@b.com',
      username: 'jane',
      password: 'secret',
    });
    component.register();
    expect(authStub.register).toHaveBeenCalledWith(
      'a@b.com',
      'secret',
      'jane',
    );
    registerSubject.next({});
    registerSubject.complete();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('stores the error code on failure', () => {
    component.register();
    registerSubject.error({ code: 'auth/invalid' });
    expect(component.error).toBe('auth/invalid');
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the login page', () => {
    component.navigateToLogin();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});

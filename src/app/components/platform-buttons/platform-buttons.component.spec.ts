import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformButtonsComponent } from './platform-buttons.component';
import { AuthService } from '../../services/auth/auth.service';
import { createAuthServiceStub } from '../../testing/service-stubs';

describe('PlatformButtonsComponent', () => {
  let component: PlatformButtonsComponent;
  let fixture: ComponentFixture<PlatformButtonsComponent>;
  let authStub: ReturnType<typeof createAuthServiceStub>;

  beforeEach(async () => {
    authStub = createAuthServiceStub();
    await TestBed.configureTestingModule({
      imports: [PlatformButtonsComponent],
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('googleSignIn delegates to the auth service', () => {
    component.googleSignIn();
    expect(authStub.googleSignIn).toHaveBeenCalled();
  });

  it('facebookSignIn delegates to the auth service', () => {
    component.facebookSignIn();
    expect(authStub.facebookSignIn).toHaveBeenCalled();
  });
});

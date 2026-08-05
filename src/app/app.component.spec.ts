import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth/auth.service';
import { createAuthServiceStub } from './testing/service-stubs';

describe('AppComponent', () => {
  let authStub: ReturnType<typeof createAuthServiceStub>;

  beforeEach(async () => {
    authStub = createAuthServiceStub();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('calls initializeUserState on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(authStub.initializeUserState).toHaveBeenCalled();
  });

  it('prevents default on double click', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const event = new MouseEvent('dblclick');
    const preventDefault = vi.spyOn(event, 'preventDefault');
    app.onDoubleClick(event);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('prevents default when a dblclick reaches the host', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    el.dispatchEvent(event);
    expect(preventDefault).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../services/auth/auth.service';
import { createRouterStub, createAuthServiceStub } from '../testing/service-stubs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let routerStub: ReturnType<typeof createRouterStub>;
  let authStub: ReturnType<typeof createAuthServiceStub>;

  beforeEach(async () => {
    routerStub = createRouterStub();
    authStub = createAuthServiceStub();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds a Form Filler item for admin users', () => {
    authStub._currentUser.next({ uid: 'u1', isAdmin: true });
    const labels = component.sidebarContent.map((i) => i.label);
    expect(labels).toContain('Form Filler');
  });

  it('does not add Form Filler twice', () => {
    authStub._currentUser.next({ uid: 'u1', isAdmin: true });
    authStub._currentUser.next({ uid: 'u1', isAdmin: true });
    const count = component.sidebarContent.filter(
      (i) => i.label === 'Form Filler',
    ).length;
    expect(count).toBe(1);
  });

  it('does not add Form Filler for non-admin users', () => {
    authStub._currentUser.next({ uid: 'u1', isAdmin: false });
    const labels = component.sidebarContent.map((i) => i.label);
    expect(labels).not.toContain('Form Filler');
  });

  it('dashboard item navigates to dashboard', () => {
    component.sidebarContent.find((i) => i.label === 'Dashboard')?.action();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('profile item navigates to profile', () => {
    component.sidebarContent.find((i) => i.label === 'Profile')?.action();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard/profile');
  });

  it('settings item navigates to settings', () => {
    component.sidebarContent.find((i) => i.label === 'Settings')?.action();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('form filler item navigates to fill-form', () => {
    authStub._currentUser.next({ uid: 'u1', isAdmin: true });
    component.sidebarContent.find((i) => i.label === 'Form Filler')?.action();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard/fill-form');
  });

  it('logout item logs out', () => {
    component.sidebarContent.find((i) => i.label === 'Logout')?.action();
    expect(authStub.logout).toHaveBeenCalled();
  });

  it('toggleSidebar updates the flag', () => {
    component.toggleSidebar(true);
    expect(component.showSidebar).toBe(true);
    component.toggleSidebar(false);
    expect(component.showSidebar).toBe(false);
  });

  it('preventCloseOnClick marks the toggler as clicked', () => {
    component.preventCloseOnClick();
    expect(component.mobileSidebarTogglerClicked).toBe(true);
  });

  it('window click closes the sidebar when the toggler was not clicked', () => {
    component.showSidebar = true;
    window.dispatchEvent(new Event('click'));
    expect(component.showSidebar).toBe(false);
    expect(component.mobileSidebarTogglerClicked).toBe(false);
  });

  it('window click keeps the sidebar open when the toggler was clicked', () => {
    component.showSidebar = true;
    component.mobileSidebarTogglerClicked = true;
    window.dispatchEvent(new Event('click'));
    expect(component.showSidebar).toBe(true);
    expect(component.mobileSidebarTogglerClicked).toBe(false);
  });

  it('logout calls the auth service', () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });

  it('spacer item action is a no-op', () => {
    const spacer = component.sidebarContent.find(
      (i) => i.icon === 'flex-grow-spacer',
    )!;
    expect(() => spacer.action()).not.toThrow();
  });
});

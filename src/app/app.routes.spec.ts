import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';
import {
  AdminOnlyGuard,
  AuthGuard,
  PublicOnlyGuard,
} from './services/auth.guard';

describe('routes', () => {
  it('defines the top-level paths', () => {
    expect(routes.map((r) => r.path)).toEqual([
      '',
      'login',
      'register',
      'dashboard',
    ]);
  });

  it('protects the landing page with PublicOnlyGuard', () => {
    const landing = routes.find((r) => r.path === '')!;
    expect(landing.canActivate).toEqual([PublicOnlyGuard]);
  });

  it('protects login and register with PublicOnlyGuard', () => {
    expect(routes.find((r) => r.path === 'login')!.canActivate).toEqual([
      PublicOnlyGuard,
    ]);
    expect(routes.find((r) => r.path === 'register')!.canActivate).toEqual([
      PublicOnlyGuard,
    ]);
  });

  it('protects the dashboard with AuthGuard', () => {
    const dashboard = routes.find((r) => r.path === 'dashboard')!;
    expect(dashboard.canActivate).toEqual([AuthGuard]);
  });

  it('defines the dashboard child routes', () => {
    const dashboard = routes.find((r) => r.path === 'dashboard')!;
    expect((dashboard.children ?? []).map((c) => c.path)).toEqual([
      '',
      'profile',
      'settings',
      'fill-form',
    ]);
  });

  it('protects fill-form with AdminOnlyGuard', () => {
    const dashboard = routes.find((r) => r.path === 'dashboard')!;
    const fillForm = (dashboard.children ?? []).find(
      (c) => c.path === 'fill-form',
    )!;
    expect(fillForm.canActivate).toEqual([AdminOnlyGuard]);
  });
});

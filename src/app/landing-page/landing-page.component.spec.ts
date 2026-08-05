import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LandingPageComponent } from './landing-page.component';
import { createRouterStub } from '../testing/service-stubs';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let routerStub: ReturnType<typeof createRouterStub>;

  beforeEach(async () => {
    routerStub = createRouterStub();
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [{ provide: Router, useValue: routerStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to login on construction', () => {
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
  });
});

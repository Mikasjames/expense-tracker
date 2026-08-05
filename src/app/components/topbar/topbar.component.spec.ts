import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HlmDialogService } from '@spartan-ng/helm/dialog';

import { TopbarComponent } from './topbar.component';
import { DateSelectorComponent } from '../date-selector/date-selector.component';
import { createRouterStub, createHlmDialogServiceStub } from '../../testing/service-stubs';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;
  let dialogStub: ReturnType<typeof createHlmDialogServiceStub>;

  beforeEach(async () => {
    dialogStub = createHlmDialogServiceStub();
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        { provide: Router, useValue: createRouterStub() },
        { provide: HlmDialogService, useValue: dialogStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('menu action toggles the sidebar and emits the new value', () => {
    const emitted: boolean[] = [];
    component.toggleSidebar.subscribe((v) => emitted.push(v));
    component.showSidebar = false;
    const menuItem = component.topbarItems[0];
    menuItem.action();
    expect(component.showSidebar).toBe(true);
    expect(emitted).toEqual([true]);
    menuItem.action();
    expect(component.showSidebar).toBe(false);
    expect(emitted).toEqual([true, false]);
  });

  it('calendar action opens the date selector dialog', () => {
    const openDateSelector = vi.spyOn(component, 'openDateSelector');
    const calendarItem = component.topbarItems[2];
    calendarItem.action();
    expect(openDateSelector).toHaveBeenCalled();
  });

  it('openDateSelector opens the DateSelectorComponent dialog', () => {
    component.openDateSelector();
    expect(dialogStub.open).toHaveBeenCalledWith(DateSelectorComponent, {
      contentClass: 'sm:max-w-2xl',
    });
  });

  it('accepts custom topbar items', () => {
    const action = vi.fn();
    component.topbarItems = [{ label: 'X', icon: 'lucideX', action }];
    component.topbarItems[0].action();
    expect(action).toHaveBeenCalled();
  });

  it('spacer action is a no-op', () => {
    const spacer = component.topbarItems[1];
    expect(() => spacer.action()).not.toThrow();
  });
});

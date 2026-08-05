import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarComponent } from './sidebar.component';
import { ToolBarContent } from '../../models/util.interface';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults sidebarItems to an empty array', () => {
    expect(component.sidebarItems).toEqual([]);
  });

  it('accepts sidebar items', () => {
    const items: ToolBarContent[] = [
      { label: 'Home', icon: 'lucideHome', action: () => {} },
    ];
    component.sidebarItems = items;
    expect(component.sidebarItems).toEqual(items);
  });
});

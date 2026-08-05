import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DollarSignSvgsComponent } from './dollar-sign-svgs.component';

describe('DollarSignSvgsComponent', () => {
  let component: DollarSignSvgsComponent;
  let fixture: ComponentFixture<DollarSignSvgsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DollarSignSvgsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DollarSignSvgsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the default signs when random is false', () => {
    component.random = false;
    component.ngOnInit();
    expect(component.dollarSignArray).toHaveLength(4);
  });

  it('generates random signs when random is true', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    component.random = true;
    component.dollarSigns = 3;
    component.minSize = 50;
    component.maxSize = 80;
    component.minOpacity = 0.05;
    component.maxOpacity = 0.15;
    component.ngOnInit();
    expect(component.dollarSignArray).toHaveLength(3);
    expect(component.dollarSignArray[0].size).toBe('65px');
    expect(component.dollarSignArray[0].opacity).toBe(0.1);
    expect(component.dollarSignArray[0].top).toBe('50%');
    expect(component.dollarSignArray[0].left).toBe('50%');
  });

  it('generateDollarSigns regenerates the array', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    component.dollarSigns = 2;
    component.generateDollarSigns();
    expect(component.dollarSignArray).toHaveLength(2);
    expect(component.dollarSignArray[0].size).toBe('57.5px');
  });
});

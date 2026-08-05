import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChartComponent } from './pie-chart.component';
import { PieData } from '../../models/chart.interface';

describe('PieChartComponent', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sorts data ascending on load', () => {
    const data: PieData[] = [
      { name: 'B', value: 20 },
      { name: 'A', value: 10 },
      { name: 'C', value: 30 },
    ];
    component.data = data;
    component.ngOnInit();
    const seriesData = (component.updateOptions as any).series[0]
      .data as PieData[];
    expect(seriesData.map((d) => d.value)).toEqual([10, 20, 30]);
  });

  it('sorts data on loadData', () => {
    component.data = [
      { name: 'X', value: 5 },
      { name: 'Y', value: 1 },
    ];
    component.loadData();
    const seriesData = (component.updateOptions as any).series[0]
      .data as PieData[];
    expect(seriesData.map((d) => d.value)).toEqual([1, 5]);
  });

  it('computes an animation delay for the pie series', () => {
    const delay = (component.options as any).series[0]
      .animationDelay as (idx: number) => number;
    expect(typeof delay(0)).toBe('number');
  });
});

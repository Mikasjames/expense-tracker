import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineBarChartComponent } from './line-bar-chart.component';
import { LineBarData } from '../../models/chart.interface';
import { UtilService } from '../../services/util/util.service';
import { createUtilServiceStub } from '../../testing/service-stubs';

describe('LineBarChartComponent', () => {
  let component: LineBarChartComponent;
  let fixture: ComponentFixture<LineBarChartComponent>;
  let utilStub: ReturnType<typeof createUtilServiceStub>;

  const data: LineBarData[] = [
    { tag: 'a', title: 'A', value: [1704067200000, 100] },
    { tag: 'b', title: 'B', value: [1704153600000, 150] },
  ];

  beforeEach(async () => {
    utilStub = createUtilServiceStub();
    await TestBed.configureTestingModule({
      imports: [LineBarChartComponent],
      providers: [{ provide: UtilService, useValue: utilStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LineBarChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.data = data;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads data on init and computes percent change', () => {
    component.data = data;
    fixture.detectChanges();
    expect(utilStub.groupLineBarDataByDay).toHaveBeenCalledWith(data);
    expect(component.percentChange).toBe(50);
    expect(component.isLoading).toBe(false);
  });

  it('reloads data on changes', () => {
    component.data = data;
    fixture.detectChanges();
    const callsBefore = utilStub.groupLineBarDataByDay.mock.calls.length;
    component.data = [...data];
    component.ngOnChanges();
    expect(utilStub.groupLineBarDataByDay.mock.calls.length).toBeGreaterThan(
      callsBefore,
    );
  });

  it('toggleChartType toggles between line and bar', () => {
    component.data = data;
    fixture.detectChanges();
    component.toggleChartType();
    expect(component.type).toBe('bar');
    expect(utilStub.groupLineBarDataByDay).toHaveBeenCalled();
    component.toggleChartType();
    expect(component.type).toBe('line');
  });

  it('toggleChartTypeSymbol reflects the chart type', () => {
    component.type = 'line';
    expect(component.toggleChartTypeSymbol).toBe('lucideChartLine');
    component.type = 'bar';
    expect(component.toggleChartTypeSymbol).toBe('lucideBarChart');
  });

  it('calculatePercentChange returns 0 with fewer than 2 points', () => {
    expect(component.calculatePercentChange([])).toBe(0);
    expect(
      component.calculatePercentChange([
        { tag: 'a', title: 'A', value: [1704067200000, 10] },
      ]),
    ).toBe(0);
  });

  it('percentChangeSymbol reflects sign', () => {
    component.percentChange = 5;
    expect(component.percentChangeSymbol).toBe('lucideArrowUp');
    component.percentChange = -5;
    expect(component.percentChangeSymbol).toBe('lucideArrowDown');
  });

  it('percentChangeClass reflects change vs income expectation', () => {
    component.percentChange = 5;
    component.isIncome = true;
    expect(component.percentChangeClass).toBe('text-emerald-600');
    component.percentChange = 5;
    component.isIncome = false;
    expect(component.percentChangeClass).toBe('text-rose-600');
    component.percentChange = -5;
    component.isIncome = true;
    expect(component.percentChangeClass).toBe('text-rose-600');
    component.percentChange = -5;
    component.isIncome = false;
    expect(component.percentChangeClass).toBe('text-emerald-600');
    component.percentChange = 0;
    expect(component.percentChangeClass).toBe('');
  });

  it('tooltip formatter renders a single point', () => {
    utilStub.groupPointsByTags.mockReturnValue({});
    utilStub.dateToMonthDateYearDay.mockReturnValue('Jan 1 2024');
    utilStub.formatTooltipBySortedPoints.mockReturnValue('<b>food</b>');
    utilStub.formatAmount.mockReturnValue('$100');
    component.data = data;
    fixture.detectChanges();
    const formatter = (component.options.tooltip as any)
      .formatter as (params: any) => string;
    const result = formatter([
      {
        data: { points: [{ tagId: 't1' }] },
        value: ['2024-01-01', 100],
      },
    ]);
    expect(result).toContain('Jan 1 2024');
    expect(result).not.toContain('Total');
  });

  it('tooltip formatter renders the total for multiple points', () => {
    utilStub.groupPointsByTags.mockReturnValue({});
    utilStub.dateToMonthDateYearDay.mockReturnValue('Jan 2 2024');
    utilStub.formatTooltipBySortedPoints.mockReturnValue('<b>food</b>');
    utilStub.formatAmount.mockReturnValue('$150');
    component.data = data;
    component.isIncome = true;
    fixture.detectChanges();
    const formatter = (component.options.tooltip as any)
      .formatter as (params: any) => string;
    const result = formatter([
      {
        data: { points: [{ tagId: 't1' }, { tagId: 't2' }] },
        value: ['2024-01-02', 150],
      },
    ]);
    expect(result).toContain('Total');
    expect(result).toContain('$150');
    expect(utilStub.formatTooltipBySortedPoints).toHaveBeenCalledWith(
      {},
      true,
    );
  });

  it('xAxis formatter converts milliseconds to a date', () => {
    utilStub.milliToDate.mockReturnValue('Jan 2024');
    component.data = data;
    fixture.detectChanges();
    const formatter = (component.options.xAxis as any).axisLabel
      .formatter as (value: string) => string;
    expect(formatter('1704067200000')).toBe('Jan 2024');
    expect(utilStub.milliToDate).toHaveBeenCalledWith(1704067200000);
  });
});

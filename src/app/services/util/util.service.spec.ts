import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { UtilService } from './util.service';
import { TagService } from '../tags/tag.service';
import { SettingsService } from '../settings/settings.service';
import {
  LineBarData,
  Money,
  Point,
  SortedByDayLineBarData,
} from '../../models/chart.interface';

describe('UtilService', () => {
  let service: UtilService;
  let tagService: { synchronousGetTagFromId: ReturnType<typeof vi.fn> };
  let settingsService: { format: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tagService = {
      synchronousGetTagFromId: vi.fn(() => ({ id: 't1', name: 'Groceries', type: 'expense' })),
    };
    settingsService = {
      format: vi.fn((value: number) => `₱${value}`),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TagService, useValue: tagService },
        { provide: SettingsService, useValue: settingsService },
      ],
    });
    service = TestBed.inject(UtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatAmount', () => {
    it('delegates to settingsService.format', () => {
      settingsService.format.mockReturnValue('₱123.45');
      expect(service.formatAmount(123.45)).toBe('₱123.45');
      expect(settingsService.format).toHaveBeenCalledWith(123.45);
    });
  });

  describe('formatDateToDayMonthYearWeekday', () => {
    it('formats a date as "MMM DD YYYY (weekday)"', () => {
      const date = new Date(2026, 7, 5, 12, 0, 0);
      const result = service.formatDateToDayMonthYearWeekday(date);
      expect(result).toBe('Aug 05 2026 (Wed)');
    });
  });

  describe('moneyToLineBarData', () => {
    it('maps money records to line bar data', () => {
      const money: Money[] = [
        {
          id: 1,
          title: 'Salary',
          amount: 1000,
          date: 123,
          notes: '',
          created_on: '',
          updated_on: '',
          user: 1,
          tags: ['income-1'],
        },
      ];
      const result = service.moneyToLineBarData(money);
      expect(result).toEqual([{ tag: 'income-1', value: [123, 1000], title: 'Salary' }]);
    });

    it('defaults missing titles to an empty string', () => {
      const money: Money[] = [
        {
          id: 2,
          title: null as unknown as string,
          amount: 5,
          date: 99,
          notes: '',
          created_on: '',
          updated_on: '',
          user: 1,
          tags: ['x'],
        },
      ];
      const result = service.moneyToLineBarData(money);
      expect(result[0].title).toBe('');
    });
  });

  describe('dateToMilli', () => {
    it('converts a date string to milliseconds', () => {
      const ms = new Date('2026-08-05').getTime();
      expect(service.dateToMilli('2026-08-05')).toBe(ms);
    });
  });

  describe('milliToDate', () => {
    it('formats milliseconds as a month and day', () => {
      const result = service.milliToDate(new Date(2026, 7, 5, 12).getTime());
      expect(result).toBe('Aug 05');
    });
  });

  describe('dateToMonthDateYearDay', () => {
    it('formats with the day when showDay is true', () => {
      const result = service.dateToMonthDateYearDay('2026-08-05');
      expect(result).toContain('August');
      expect(result).toContain('2026');
      expect(result).toContain('5');
    });

    it('omits the day when showDay is false', () => {
      const result = service.dateToMonthDateYearDay('2026-08-05', false);
      expect(result).toContain('August');
      expect(result).toContain('2026');
      expect(result).not.toContain('5,');
    });
  });

  describe('groupLineBarDataByDay', () => {
    it('groups points by day and sums their values', () => {
      const day1 = new Date(2026, 7, 5, 9, 0, 0);
      const day2 = new Date(2026, 7, 6, 9, 0, 0);
      const data: LineBarData[] = [
        { tag: 'a', value: [day1.getTime(), 10], title: 'One' },
        { tag: 'b', value: [day1.getTime(), 20], title: 'Two' },
        { tag: 'a', value: [day2.getTime(), 30], title: 'Three' },
      ];

      const result = service.groupLineBarDataByDay(data);

      expect(result).toHaveLength(2);
      const sorted = result.sort(
        (a, b) => (a.value[0] as number) - (b.value[0] as number),
      );
      const firstDay = sorted[0];
      const secondDay = sorted[1];

      expect(firstDay.value[0]).toBe(new Date(2026, 7, 5).getTime());
      expect(firstDay.value[1]).toBe(30);
      expect(firstDay.points).toEqual([
        { tag: 'a', value: 10, title: 'One' },
        { tag: 'b', value: 20, title: 'Two' },
      ]);

      expect(secondDay.value[0]).toBe(new Date(2026, 7, 6).getTime());
      expect(secondDay.value[1]).toBe(30);
      expect(secondDay.points).toEqual([
        { tag: 'a', value: 30, title: 'Three' },
      ]);
    });

    it('handles an empty input', () => {
      expect(service.groupLineBarDataByDay([])).toEqual([]);
    });
  });

  describe('groupBarDataByMonth', () => {
    it('groups values by month and sums them', () => {
      const jan1 = new Date(2026, 0, 5).getTime();
      const jan2 = new Date(2026, 0, 20).getTime();
      const feb1 = new Date(2026, 1, 3).getTime();

      const result = service.groupBarDataByMonth([
        [jan1, 100],
        [jan2, 50],
        [feb1, 75],
      ]);

      expect(result).toHaveLength(2);
      const jan = result.find(
        (item: [number, number]) => item[0] === new Date(2026, 0).getTime(),
      );
      const feb = result.find(
        (item: [number, number]) => item[0] === new Date(2026, 1).getTime(),
      );
      expect(jan[1]).toBe(150);
      expect(feb[1]).toBe(75);
    });
  });

  describe('groupPointsByTags', () => {
    it('groups points by tag', () => {
      const points: Point[] = [
        { tag: 'a', title: 'One', value: 10 },
        { tag: 'a', title: 'Two', value: 20 },
        { tag: 'b', title: 'Three', value: 30 },
      ];

      const result = service.groupPointsByTags(points);

      expect(Object.keys(result)).toEqual(['a', 'b']);
      expect(result['a']).toEqual({
        tag: 'a',
        points: [
          { title: 'One', value: 10 },
          { title: 'Two', value: 20 },
        ],
      });
      expect(result['b']).toEqual({
        tag: 'b',
        points: [{ title: 'Three', value: 30 }],
      });
    });
  });

  describe('formatTooltipBySortedPoints', () => {
    it('builds an html tooltip using tag and settings services', () => {
      const grouped = {
        a: {
          tag: 't1',
          points: [
            { title: 'One', value: 10 },
            { title: 'Two', value: 20 },
          ],
        },
      };

      const result = service.formatTooltipBySortedPoints(grouped, false);

      expect(tagService.synchronousGetTagFromId).toHaveBeenCalledWith('t1', 'expense');
      expect(settingsService.format).toHaveBeenCalledWith(10);
      expect(settingsService.format).toHaveBeenCalledWith(20);
      expect(result).toContain('Groceries');
      expect(result).toContain('One: ₱10');
      expect(result).toContain('Two: ₱20');
    });

    it('uses the income tag type when isIncome is true', () => {
      const grouped = {
        a: { tag: 't2', points: [{ title: 'One', value: 10 }] },
      };

      service.formatTooltipBySortedPoints(grouped, true);

      expect(tagService.synchronousGetTagFromId).toHaveBeenCalledWith('t2', 'income');
    });
  });
});

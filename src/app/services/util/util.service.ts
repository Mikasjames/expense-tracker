import { Injectable } from '@angular/core';
import {
  GroupedData,
  GroupedPointsByTags,
  LineBarData,
  Money,
  Point,
  SortedByDayLineBarData,
  TitleValue,
} from '../../models/chart.interface';
import { TagService } from '../tags/tag.service';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  constructor(private tagService: TagService) {}

  formatDateToDayMonthYearWeekday(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'short',
    };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    const [weekday, day, month, year] = formattedDate
      .replace(',', '')
      .split(' ');
    return `${month} ${day} ${year} (${weekday})`;
  }

  moneyToLineBarData(moneyData: Money[]): LineBarData[] {
    return moneyData.map((item: Money): LineBarData => {
      return {
        tag: item.tags[0],
        value: [item.date, item.amount],
        title: item.title ?? '',
      };
    });
  }

  // convert string dates YYYY-MM-DD to milliseconds
  dateToMilli(date: string): number {
    return new Date(date).getTime();
  }

  milliToDate(milli: number): string {
    return new Date(milli)
      .toLocaleDateString('en-CA', { month: 'short', day: '2-digit' })
      .split('T')[0];
  }

  dateToMonthDateYearDay(date: string, showDay: boolean = true) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: showDay ? 'numeric' : undefined,
    };
    return new Date(date).toLocaleDateString('en-US', options);
  }

  groupLineBarDataByDay(data: LineBarData[]): SortedByDayLineBarData[] {
    const groupedData: GroupedData = {};

    data.forEach((item: LineBarData) => {
      const date: Date = new Date(item.value[0]);
      const yearMonthDay = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

      if (!groupedData[yearMonthDay]) {
        groupedData[yearMonthDay] = [];
      }
      groupedData[yearMonthDay].push({
        tag: item.tag,
        value: item.value[1],
        title: item.title,
      });
    });

    return Object.entries(groupedData).map(
      ([yearMonthDay, points]): SortedByDayLineBarData => {
        const typedPoints = points as Point[];
        const [year, month, day] = yearMonthDay.split('-');
        const dayInMilliseconds = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        ).getTime();
        return {
          value: [
            dayInMilliseconds,
            typedPoints.reduce(
              (acc: number, item: TitleValue) => acc + Number(item.value),
              0,
            ),
          ],
          points: typedPoints,
        };
      },
    );
  }

  groupBarDataByMonth(data: any): any {
    const groupedData: any = [];

    data.forEach((item: any) => {
      const date: Date = new Date(item[0]);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!groupedData[yearMonth]) {
        groupedData[yearMonth] = 0;
      }
      groupedData[yearMonth] += item[1];
    });

    return Object.entries(groupedData).map(([yearMonth, accumulatedValue]) => {
      const [year, month] = yearMonth.split('-');
      const monthInMilliseconds = new Date(
        parseInt(year),
        parseInt(month) - 1,
      ).getTime();
      return [monthInMilliseconds, accumulatedValue];
    });
  }

  groupPointsByTags(points: Point[]): {
    [key: string]: { tag: string; points: TitleValue[] };
  } {
    return points.reduce(
      (acc: { [key: string]: { tag: string; points: TitleValue[] } }, item) => {
        if (!acc[item.tag]) {
          acc[item.tag] = {
            tag: item.tag,
            points: [],
          };
        }
        acc[item.tag].points.push({
          title: item.title,
          value: item.value,
        });
        return acc;
      },
      {},
    );
  }

  formatTooltipBySortedPoints(
    sortedPointsByTags: GroupedPointsByTags,
    isIncome = false,
  ): string {
    return Object.values(sortedPointsByTags)
      .map((tag: { tag: string; points: TitleValue[] }) => {
        const tagName = this.tagService.synchronousGetTagFromId(
          tag.tag,
          isIncome ? 'income' : 'expense',
        ).name;
        const pointsString = tag.points
          .map((point: TitleValue) => `${point.title}: ₱${point.value}`)
          .join('<br/>');
        return `<small><pr><code>${tagName}</code></pr></small><br/>${pointsString}`;
      })
      .join('<br/>');
  }
}

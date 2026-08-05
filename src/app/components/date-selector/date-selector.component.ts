import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HlmCalendarRange } from '@spartan-ng/helm/calendar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';

@Component({
  selector: 'app-date-selector',
  imports: [HlmCalendarRange, HlmButtonImports],
  templateUrl: './date-selector.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './date-selector.component.sass',
})
export class DateSelectorComponent {
  readonly startDate = signal<Date | undefined>(undefined);
  readonly endDate = signal<Date | undefined>(undefined);
  readonly presets = [
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Last Year', value: 'lastYear' },
  ] as const;

  constructor(private dateSelectorService: DateSelectorService) {
    this.dateSelectorService.dateRange$.subscribe((dateRange) => {
      if (dateRange && dateRange.from && dateRange.to) {
        this.startDate.set(dateRange.from);
        this.endDate.set(dateRange.to);
      } else {
        this.startDate.set(undefined);
        this.endDate.set(undefined);
      }
    });
  }

  onStartDateChange(date: Date | undefined) {
    this.startDate.set(date);
    this.emitRange();
  }

  onEndDateChange(date: Date | undefined) {
    this.endDate.set(date);
    this.emitRange();
  }

  selectRange(range: string) {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (range) {
      case 'thisWeek':
        from = this.getStartOfWeek(today);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      case 'lastWeek':
        const startOfThisWeek = this.getStartOfWeek(today);
        to = new Date(startOfThisWeek);
        to.setDate(startOfThisWeek.getDate() - 1);
        from = new Date(to);
        from.setDate(to.getDate() - 6);
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        from = new Date(today.getFullYear() - 1, 0, 1);
        to = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'clear':
        this.clearDateRange();
        return;
      default:
        return;
    }

    this.startDate.set(from);
    this.endDate.set(to);
    this.dateSelectorService.setDateRange({ from, to });
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  clearDateRange() {
    this.startDate.set(undefined);
    this.endDate.set(undefined);
    this.dateSelectorService.clearDateRange();
  }

  private emitRange() {
    const from = this.startDate();
    const to = this.endDate();
    if (from && to) {
      this.dateSelectorService.setDateRange({ from, to });
    }
  }
}
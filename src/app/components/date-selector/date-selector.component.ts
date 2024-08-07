import { Component } from '@angular/core';
import {
  NgbCalendar,
  NgbDate,
  NgbDatepicker,
} from '@ng-bootstrap/ng-bootstrap';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';

@Component({
  selector: 'app-date-selector',
  standalone: true,
  imports: [NgbDatepicker],
  templateUrl: './date-selector.component.html',
  styleUrl: './date-selector.component.sass',
})
export class DateSelectorComponent {
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  startDate: NgbDate = this.calendar.getToday();

  constructor(
    private calendar: NgbCalendar,
    private dateSelectorService: DateSelectorService,
  ) {
    this.dateSelectorService.dateRange$.subscribe((dateRange) => {
      if (dateRange && dateRange.from && dateRange.to) {
        this.fromDate = this.convertDateToNgbDate(dateRange.from);
        this.toDate = this.convertDateToNgbDate(dateRange.to);
      } else {
        this.fromDate = null;
        this.toDate = null;
      }
      this.updateStartDate();
    });
  }

  onDateSelection(date: NgbDate) {
    let fromDateObj = this.fromDate
      ? this.convertNgbDateToDate(this.fromDate)
      : null;
    let toDateObj = this.toDate ? this.convertNgbDateToDate(this.toDate) : null;
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      fromDateObj = this.convertNgbDateToDate(this.fromDate);
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      toDateObj = this.convertNgbDateToDate(this.toDate);
    } else {
      this.toDate = null;
      toDateObj = null;
      this.fromDate = date;
      fromDateObj = this.convertNgbDateToDate(this.fromDate);
    }
    if (fromDateObj && toDateObj) {
      this.dateSelectorService.setDateRange({
        from: fromDateObj,
        to: toDateObj,
      });
    }
  }

  selectRange(range: string) {
    const today = new Date();
    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    switch (range) {
      case 'thisWeek':
        fromDate = this.getStartOfWeek(today);
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6);
        break;
      case 'lastWeek':
        const startOfThisWeek = this.getStartOfWeek(today);
        toDate = new Date(startOfThisWeek);
        toDate.setDate(startOfThisWeek.getDate() - 1);
        fromDate = new Date(toDate);
        fromDate.setDate(toDate.getDate() - 6);
        break;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = this.getLastDayOfCurrentMonth();
        break;
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = this.getLastDayOfCurrentYear();
        break;
      case 'lastYear':
        fromDate = new Date(today.getFullYear() - 1, 0, 1);
        toDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'clear':
        this.clearDateRange();
        break;
      default:
        return;
    }

    if (fromDate && toDate) {
      this.fromDate = this.convertDateToNgbDate(fromDate);
      this.toDate = this.convertDateToNgbDate(toDate);
      this.dateSelectorService.setDateRange({ from: fromDate, to: toDate });
      this.updateStartDate();
    }
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  clearDateRange() {
    this.dateSelectorService.clearDateRange();
  }

  getLastDayOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  getLastDayOfCurrentYear(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31);
  }

  convertNgbDateToDate(ngbDate: NgbDate): Date {
    return new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
  }

  convertDateToNgbDate(date: Date): NgbDate {
    return new NgbDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate &&
      !this.toDate &&
      this.hoveredDate &&
      date.after(this.fromDate) &&
      date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  updateStartDate() {
    if (this.fromDate) {
      this.startDate = this.fromDate;
    } else {
      this.startDate = this.calendar.getToday();
    }
  }
}

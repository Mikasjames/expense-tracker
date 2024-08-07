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
}

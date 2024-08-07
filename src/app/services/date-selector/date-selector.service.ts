import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DateSelectorService {
  private dateRangeSubject: BehaviorSubject<{ from: Date; to: Date } | null> =
    new BehaviorSubject<{ from: Date; to: Date } | null>(null);
  dateRange$: Observable<{ from: Date; to: Date } | null> =
    this.dateRangeSubject.asObservable();

  constructor() {}

  setDateRange(dateRange: { from: Date; to: Date }) {
    this.dateRangeSubject.next(dateRange);
  }

  getDateRange(): Observable<{ from: Date; to: Date } | null> {
    return this.dateRange$;
  }
}

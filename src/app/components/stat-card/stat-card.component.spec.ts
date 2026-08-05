import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable } from 'rxjs';

import { StatCardComponent } from './stat-card.component';
import { SettingsService } from '../../services/settings/settings.service';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;
  let settingsSubject: BehaviorSubject<any>;
  let settingsStub: {
    settings$: Observable<any>;
    format: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    settingsSubject = new BehaviorSubject<any>({});
    settingsStub = {
      settings$: settingsSubject.asObservable(),
      format: vi.fn(() => '$0.00'),
    };
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [{ provide: SettingsService, useValue: settingsStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formats the value on init', () => {
    expect(settingsStub.format).toHaveBeenCalledWith(0);
    expect(component.formattedValue).toBe('$0.00');
  });

  it('reformats the value when settings emit', () => {
    settingsStub.format.mockReturnValue('$1.00');
    settingsSubject.next({ currency: 'EUR' });
    expect(settingsStub.format).toHaveBeenCalled();
    expect(component.formattedValue).toBe('$1.00');
  });

  it('reformats the value on input changes', () => {
    settingsStub.format.mockReturnValue('$9.99');
    component.value = 9.99;
    component.ngOnChanges();
    expect(component.formattedValue).toBe('$9.99');
  });

  it('unsubscribes on destroy', () => {
    component.ngOnDestroy();
    settingsSubject.next({ currency: 'GBP' });
    const callsAfterDestroy = settingsStub.format.mock.calls.length;
    settingsSubject.next({ currency: 'JPY' });
    expect(settingsStub.format.mock.calls.length).toBe(callsAfterDestroy);
  });

  it('roundedPercentChange rounds and prefixes positive values', () => {
    component.percentChange = 12.6;
    expect(component.roundedPercentChange).toBe('+13');
    component.percentChange = -12.6;
    expect(component.roundedPercentChange).toBe('-13');
  });

  it('roundedPercentChange returns zero without a sign', () => {
    component.percentChange = 0;
    expect(component.roundedPercentChange).toBe('0');
  });

  it('percentChangeClass is empty at zero change', () => {
    component.percentChange = 0;
    expect(component.percentChangeClass).toBe('');
  });

  it('percentChangeClass is emerald when up and income', () => {
    component.percentChange = 5;
    component.isIncome = true;
    expect(component.percentChangeClass).toBe('text-emerald-600');
  });

  it('percentChangeClass is rose when up and expense', () => {
    component.percentChange = 5;
    component.isIncome = false;
    expect(component.percentChangeClass).toBe('text-rose-600');
  });

  it('percentChangeClass is rose when down and income', () => {
    component.percentChange = -5;
    component.isIncome = true;
    expect(component.percentChangeClass).toBe('text-rose-600');
  });

  it('percentChangeClass is emerald when down and expense', () => {
    component.percentChange = -5;
    component.isIncome = false;
    expect(component.percentChangeClass).toBe('text-emerald-600');
  });
});

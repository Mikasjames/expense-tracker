import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';

import { SettingsService } from '../../services/settings/settings.service';

@Component({
  selector: 'app-stat-card',
  imports: [],
  templateUrl: './stat-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stat-card.component.sass',
})
export class StatCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title = 'Title';
  @Input() value = 0;
  @Input() percentChange = 0;
  @Input() isIncome = true;
  formattedValue = '0';

  private subscription: any;

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.subscription = this.settingsService.settings$.subscribe(() => {
      this.updateFormattedValue();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  ngOnChanges() {
    this.updateFormattedValue();
  }

  private updateFormattedValue() {
    this.formattedValue = this.settingsService.format(this.value);
  }

  get roundedPercentChange() {
    const rounded = Math.round(this.percentChange);
    return `${rounded > 0 ? '+' : ''}${rounded}`;
  }

  get percentChangeClass() {
    if (this.percentChange === 0) return '';
    const isUp = this.percentChange > 0;
    const good = isUp === this.isIncome;
    return good ? 'text-emerald-600' : 'text-rose-600';
  }
}

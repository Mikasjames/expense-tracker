import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings/settings.service';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
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
    return this.isIncome
      ? this.percentChange > 0
        ? 'text-success'
        : 'text-danger'
      : this.percentChange > 0
        ? 'text-danger'
        : 'text-success';
  }
}

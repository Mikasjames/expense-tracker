import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.sass',
})
export class StatCardComponent {
  @Input() title = 'Title';
  @Input() value = 0;
  @Input() percentChange = 0;
  @Input() isIncome = true;

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

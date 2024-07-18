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
}

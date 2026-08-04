import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-wave',
  imports: [],
  templateUrl: './wave.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './wave.component.sass',
})
export class WaveComponent {
  @Input() wave = 'top';
}

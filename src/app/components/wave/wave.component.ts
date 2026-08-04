import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-wave',
  imports: [],
  templateUrl: './wave.component.html',
  styleUrl: './wave.component.sass',
})
export class WaveComponent {
  @Input() wave = 'top';
}

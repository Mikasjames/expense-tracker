import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wave',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wave.component.html',
  styleUrl: './wave.component.sass',
})
export class WaveComponent {
  @Input() wave = 'top';
}

import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-dollar-sign-svgs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dollar-sign-svgs.component.html',
  styleUrl: './dollar-sign-svgs.component.sass'
})
export class DollarSignSvgsComponent implements OnInit {
  @Input() dollarSigns: number = 5;
  @Input() minSize: number = 50;
  @Input() maxSize: number = 80;
  @Input() minOpacity: number = 0.05;
  @Input() maxOpacity: number = 0.15;
  @Input() random = false;

  dollarSignArray: Array<{
    top: string;
    left: string;
    size: string;
    opacity: number;
  }> = [
    {top: '70%', left: '25%', size: '200px', opacity: 0.1},
    {top: '20%', left: '75%', size: '150px', opacity: 0.05},
    {top: '25%', left: '50%', size: '70px', opacity: 0.15},
    {top: '60%', left: '40%', size: '80px', opacity: 0.1},
  ];

  ngOnInit() {
    if (this.random) {
      this.generateDollarSigns();
    }
  }

  generateDollarSigns() {
    this.dollarSignArray = Array(this.dollarSigns).fill(null).map(() => ({
      top: `${this.getRandomNumber(10, 90)}%`,
      left: `${this.getRandomNumber(10, 90)}%`,
      size: `${this.getRandomNumber(this.minSize, this.maxSize)}px`,
      opacity: this.getRandomNumber(this.minOpacity, this.maxOpacity)
    }));
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}

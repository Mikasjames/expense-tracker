import {Component, HostListener, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { provideEcharts } from 'ngx-echarts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
  providers: [provideEcharts()],
})
export class AppComponent implements OnInit {
  @HostListener('dblclick', ['$event'])
  onDoubleClick(event: MouseEvent) {
    event.preventDefault();
  }
  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.initializeUserState();
  }
}

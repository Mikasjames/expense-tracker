import {
  Component,
  HostListener,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { provideEcharts } from 'ngx-echarts';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
  changeDetection: ChangeDetectionStrategy.Eager,
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

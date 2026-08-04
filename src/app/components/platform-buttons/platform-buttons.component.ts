import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-platform-buttons',
  imports: [],
  templateUrl: './platform-buttons.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './platform-buttons.component.sass',
})
export class PlatformButtonsComponent {
  constructor(private authService: AuthService) {}
  googleSignIn() {
    this.authService.googleSignIn();
  }

  facebookSignIn() {
    this.authService.facebookSignIn();
  }
}

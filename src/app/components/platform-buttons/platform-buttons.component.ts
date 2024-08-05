import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-platform-buttons',
  standalone: true,
  imports: [],
  templateUrl: './platform-buttons.component.html',
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

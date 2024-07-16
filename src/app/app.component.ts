import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass',
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.user$.subscribe((user) => {
      if (user) {
        this.auth.currentUserSig.set({
          email: user.email!,
          username: user.displayName!,
        });
      } else {
        this.auth.currentUserSig.set(null);
      }
      console.log(this.auth.currentUserSig());
    });
  }
}

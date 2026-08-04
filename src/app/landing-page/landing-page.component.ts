import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.sass',
})
export class LandingPageComponent {
  constructor(private router: Router) {
    this.router.navigate(['/login']);
  }
}

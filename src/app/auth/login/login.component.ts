import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { DollarSignSvgsComponent } from '../../components/dollar-sign-svgs/dollar-sign-svgs.component';
import { WaveComponent } from '../../components/wave/wave.component';
import { PlatformService } from '../../services/platform/platform.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DollarSignSvgsComponent,
    WaveComponent,
    LoaderComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.sass',
})
export class LoginComponent {
  isLoading = true;
  loginForm = this.fb.nonNullable.group({
    email: [''],
    password: [''],
  });
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private platformService: PlatformService,
  ) {
    if (this.platformService.isBrowser()) {
      this.isLoading = false;
    }
  }

  login() {
    this.isLoading = true;
    const rawForm = this.loginForm.getRawValue();
    this.auth.login(rawForm.email, rawForm.password).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (error) => {
        this.error = error.code;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  navigateToRegister() {
    this.router.navigateByUrl('/register');
  }
}

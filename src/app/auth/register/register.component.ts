import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { WaveComponent } from '../../components/wave/wave.component';
import { DollarSignSvgsComponent } from '../../components/dollar-sign-svgs/dollar-sign-svgs.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, WaveComponent, DollarSignSvgsComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.sass',
})
export class RegisterComponent {
  registerForm = this.fb.nonNullable.group({
    email: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  register() {
    console.log(this.registerForm.value);
    const rawValue = this.registerForm.getRawValue();
    this.authService
      .register(rawValue.email, rawValue.password, rawValue.username)
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: (error) => {
          this.error = error.code;
        },
      });
  }

  navigateToLogin() {
    this.router.navigateByUrl('/login');
  }
}

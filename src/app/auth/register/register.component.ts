import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
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
}

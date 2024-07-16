import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.sass',
})
export class LoginComponent {
  loginForm = this.fb.nonNullable.group({
    email: [''],
    password: [''],
  });
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {}

  login() {
    const rawForm = this.loginForm.getRawValue();
    this.auth.login(rawForm.email, rawForm.password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error) => {
        this.error = error.code;
      },
    });
  }
}

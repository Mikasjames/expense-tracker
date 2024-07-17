import { Component, Input } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { SidebarContent } from '../../models/util.interface';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.sass',
})
export class SidebarComponent {
  @Input() sidebarItems: SidebarContent[] = [
    {
      label: 'Dashboard',
      icon: 'bi bi-house',
      action: () => {
        this.router.navigateByUrl('/dashboard');
      },
    },
    {
      label: 'Profile',
      icon: 'bi bi-person',
      action: () => {
        this.router.navigateByUrl('/profile');
      },
    },
    {
      label: 'Settings',
      icon: 'bi bi-gear',
      action: () => {
        this.router.navigateByUrl('/settings');
      },
    },
    {
      label: '',
      icon: 'flex-grow-spacer',
      action: () => {},
    },
    {
      label: 'Logout',
      icon: 'bi bi-box-arrow-right',
      action: () => {
        this.logout();
      },
    },
  ];
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  logout() {
    this.authService.logout();
  }
}

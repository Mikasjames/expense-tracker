import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.sass',
})
export class DashboardComponent {
  showSidebar = false;
  mobileSidebarTogglerClicked = false;
  sidebarContent = [
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
    private renderer: Renderer2,
    private authService: AuthService,
    private router: Router,
  ) {
    this.handleAdminUser();
    this.renderer.listen('window', 'click', (e: Event) => {
      if (!this.mobileSidebarTogglerClicked) {
        this.showSidebar = false;
      }
      this.mobileSidebarTogglerClicked = false;
    });
  }

  handleAdminUser() {
    this.authService.currentUser$.subscribe((user) => {
      if (user && user.isAdmin) {
        const isFormFiller = this.sidebarContent.some(
          (item) => item.label === 'Form Filler',
        );
        if (isFormFiller) return;
        this.sidebarContent.unshift({
          label: 'Form Filler',
          icon: 'bi bi-file-earmark-text',
          action: () => {
            this.router.navigateByUrl('/dashboard/fill-form');
          },
        });
      }
    });
  }

  toggleSidebar(showSidebar: boolean) {
    this.showSidebar = showSidebar;
  }

  preventCloseOnClick() {
    this.mobileSidebarTogglerClicked = true;
  }

  logout() {
    this.authService.logout();
  }
}

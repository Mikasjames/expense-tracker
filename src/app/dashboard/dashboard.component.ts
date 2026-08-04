import {
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, NgClass, SidebarComponent, TopbarComponent],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.component.sass',
})
export class DashboardComponent {
  showSidebar = false;
  mobileSidebarTogglerClicked = false;
  sidebarContent = [
    {
      label: 'Dashboard',
      icon: 'lucideHouse',
      action: () => {
        this.router.navigateByUrl('/dashboard');
      },
    },
    {
      label: 'Profile',
      icon: 'lucideUser',
      action: () => {
        this.router.navigateByUrl('/dashboard/profile');
      },
    },
    {
      label: 'Settings',
      icon: 'lucideSettings',
      action: () => {
        this.router.navigateByUrl('/dashboard/settings');
      },
    },
    {
      label: '',
      icon: 'flex-grow-spacer',
      action: () => {},
    },
    {
      label: 'Logout',
      icon: 'lucideLogOut',
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
          icon: 'lucideFileText',
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

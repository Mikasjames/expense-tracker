import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { CommonModule } from '@angular/common';

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

  constructor(private renderer: Renderer2) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (!this.mobileSidebarTogglerClicked) {
        this.showSidebar = false;
      }
      this.mobileSidebarTogglerClicked = false;
    });
  }

  toggleSidebar(showSidebar: boolean) {
    this.showSidebar = showSidebar;
  }

  preventCloseOnClick() {
    this.mobileSidebarTogglerClicked = true;
  }
}

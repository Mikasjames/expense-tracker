import { Component, Input } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { ToolBarContent } from '../../models/util.interface';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.sass',
})
export class SidebarComponent {
  @Input() sidebarItems: ToolBarContent[] = [];
  constructor() {}
}

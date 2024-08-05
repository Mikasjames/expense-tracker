import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ToolBarContent } from '../../models/util.interface';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, NgbTooltip],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.sass',
})
export class TopbarComponent {
  @Input() showSidebar = false;
  @Input() topbarItems: ToolBarContent[] = [
    {
      label: 'Show Options',
      icon: 'bi bi-three-dots-vertical',
      action: () => {
        this.showSidebar = !this.showSidebar;
        this.toggleSidebar.emit(this.showSidebar);
      },
    },
    {
      label: '',
      icon: 'flex-grow-spacer',
      action: () => {},
    },
  ];
  @Output() toggleSidebar = new EventEmitter<boolean>();

  constructor(private router: Router) {}
}

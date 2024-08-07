import {
  Component,
  EventEmitter,
  Input,
  Output,
  Renderer2,
} from '@angular/core';
import { ToolBarContent } from '../../models/util.interface';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { DateSelectorComponent } from '../date-selector/date-selector.component';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, NgbTooltip, DateSelectorComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.sass',
})
export class TopbarComponent {
  @Input() showSidebar = false;
  @Input() topbarItems: ToolBarContent[] = [
    {
      label: '',
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
    {
      label: '',
      icon: 'bi bi-calendar-fill',
      action: () => {
        this.toggleDateSelector();
        this.preventCloseOnClick();
      },
    },
  ];
  @Output() toggleSidebar = new EventEmitter<boolean>();
  showDateSelector = false;
  dateSelectorClicked = false;

  constructor(
    private router: Router,
    private dateSelectorService: DateSelectorService,
    private renderer: Renderer2,
  ) {
    this.dateSelectorService.dateRange$.subscribe(() => {
      this.showDateSelector = false;
    });

    this.renderer.listen('window', 'click', (e: Event) => {
      if (!this.dateSelectorClicked) {
        this.showDateSelector = false;
      }
      this.dateSelectorClicked = false;
    });
  }

  toggleDateSelector() {
    this.showDateSelector = !this.showDateSelector;
  }

  preventCloseOnClick() {
    this.dateSelectorClicked = true;
  }
}

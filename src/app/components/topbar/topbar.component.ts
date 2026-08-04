import {
  Component,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ToolBarContent } from '../../models/util.interface';
import { Router } from '@angular/router';

import { DateSelectorComponent } from '../date-selector/date-selector.component';
import { DateSelectorService } from '../../services/date-selector/date-selector.service';
import { NgIcon } from '@ng-icons/core';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-topbar',
  imports: [HlmTooltipImports, HlmButtonImports, NgIcon, DateSelectorComponent],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './topbar.component.sass',
})
export class TopbarComponent {
  @Input() showSidebar = false;
  @Input() topbarItems: ToolBarContent[] = [
    {
      label: '',
      icon: 'lucideMenu',
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
      icon: 'lucideCalendarDays',
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

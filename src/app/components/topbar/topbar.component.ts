import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ToolBarContent } from '../../models/util.interface';
import { Router } from '@angular/router';

import { DateSelectorComponent } from '../date-selector/date-selector.component';
import { NgIcon } from '@ng-icons/core';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';

@Component({
  selector: 'app-topbar',
  imports: [HlmTooltipImports, HlmButtonImports, NgIcon],
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
        this.openDateSelector();
      },
    },
  ];
  @Output() toggleSidebar = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private dialogService: HlmDialogService,
  ) {}

  openDateSelector() {
    this.dialogService.open(DateSelectorComponent, {
      contentClass: 'sm:max-w-2xl',
    });
  }
}

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { ToolBarContent } from '../../models/util.interface';

@Component({
  selector: 'app-sidebar',
  imports: [HlmButtonImports, HlmTooltipImports, NgIcon],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sidebar.component.sass',
})
export class SidebarComponent {
  @Input() sidebarItems: ToolBarContent[] = [];
  constructor() {}
}
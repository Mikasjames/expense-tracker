import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import {
  GroupedPointsByTags,
  LineBarData,
  Point,
  SortedByDayLineBarData,
} from '../../models/chart.interface';
import { UtilService } from '../../services/util/util.service';
import { CustomSeriesOption } from 'echarts';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

@Component({
  selector: 'app-line-bar-chart',
  imports: [NgxEchartsDirective, HlmButtonImports, HlmTooltipImports, NgIcon],
  templateUrl: './line-bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './line-bar-chart.component.scss',
})
export class LineBarChartComponent {
  @Input() data: LineBarData[] = [];
  @Input() title = '';
  @Input() percentChangeMessage = 'Recent change:';
  @Input() isIncome = false;
  @Input() type = 'line';
  @Input() height = '150px';
  percentChange = 0;
  isLoading = false;

  constructor(private utilService: UtilService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(): void {
    this.loadData();
  }

  toggleChartType() {
    if (this.type === 'line') {
      this.type = 'bar';
    } else {
      this.type = 'line';
    }
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    const sortedData: SortedByDayLineBarData[] =
      this.utilService.groupLineBarDataByDay(this.data);
    this.percentChange = this.calculatePercentChange(this.data);
    this.options = {
      ...this.options,
      series: [
        {
          data: sortedData,
          type: this.type,
          itemStyle: {
            color: '#c23531',
          },
          smooth: true,
        },
      ] as CustomSeriesOption,
    };
    this.isLoading = false;
  }

  get toggleChartTypeSymbol() {
    return this.type === 'bar' ? 'lucideBarChart' : 'lucideChartLine';
  }

  calculatePercentChange(data: LineBarData[]): number {
    if (data.length < 2) return 0;
    const first = data[0].value[1];
    const last = data[data.length - 1].value[1];
    return ((last - first) / first) * 100;
  }

  options: EChartsOption = {
    tooltip: {
      confine: true,
      trigger: 'axis',
      formatter: (params: any) => {
        params = params[0];
        const sortedPointsByTags: GroupedPointsByTags =
          this.utilService.groupPointsByTags(params.data.points as Point[]);
        const date = this.utilService.dateToMonthDateYearDay(params.value[0]);
        const result = this.utilService.formatTooltipBySortedPoints(
          sortedPointsByTags,
          this.isIncome,
        );
        return (
          `<small>${date}</small><br/>${result}<br/>` +
          `${params.data.points.length > 1 ? `<small>Total: ${this.utilService.formatAmount(params.value[1])}</small>` : ''}`
        );
      },
      axisPointer: {
        animation: false,
      },
    },
    xAxis: {
      type: 'category',
      splitLine: {
        show: false,
      },
      axisLabel: {
        formatter: (value: string) => {
          return this.utilService.milliToDate(Number(value));
        },
      },
      show: false,
    },
    grid: {
      bottom: '5%',
      top: '5%',
      left: 0,
      right: 0,
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: false,
      },
      show: false,
    },
    series: [
      {
        name: 'Mock Data',
        type: this.type,
        showSymbol: true,
        data: [],
        itemStyle: {
          color: '#c23531',
        },
      },
    ] as CustomSeriesOption,
  };

  get percentChangeSymbol() {
    return this.percentChange > 0 ? 'lucideArrowUp' : 'lucideArrowDown';
  }

  get percentChangeClass() {
    if (this.percentChange === 0) return '';
    const isPositiveChange = this.percentChange > 0;
    const good = isPositiveChange === this.isIncome;
    return good ? 'text-emerald-600' : 'text-rose-600';
  }
}

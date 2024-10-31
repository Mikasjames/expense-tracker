import { Component, Input } from '@angular/core';
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
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-line-bar-chart',
  standalone: true,
  imports: [NgxEchartsDirective, TitleCasePipe],
  templateUrl: './line-bar-chart.component.html',
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
    return this.type === 'bar' ? 'bi bi-bar-chart-fill' : 'bi bi-graph-up';
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
          `${params.data.points.length > 1 ? `<small>Total: ₱${params.value[1].toLocaleString()}</small>` : ''}`
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
    return this.percentChange > 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
  }

  get percentChangeClass() {
    let colorClasses = '';

    if (this.percentChange !== 0) {
      const isPositiveChange = this.percentChange > 0;
      if (this.isIncome) {
        colorClasses = isPositiveChange ? 'text-success' : 'text-danger';
      } else {
        colorClasses = isPositiveChange ? 'text-danger' : 'text-success';
      }
    }

    return `${colorClasses}`;
  }
}

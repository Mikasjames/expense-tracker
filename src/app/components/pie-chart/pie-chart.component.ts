import { Component, Input } from "@angular/core";
import { NgxEchartsDirective } from "ngx-echarts";
import { EChartsOption } from "echarts";
import { PieData } from "../../models/chart.interface";

@Component({
  selector: "app-pie-chart",
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: "./pie-chart.component.html",
  styleUrl: "./pie-chart.component.scss",
})
export class PieChartComponent {
  @Input() data: PieData[] = [];
  @Input() title: string = "";
  updateOptions: EChartsOption = {};

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.updateOptions = {
      series: [
        {
          data: this.data.sort(function (a, b) {
            return a.value - b.value;
          }),
        },
      ],
    };
  }

  options: EChartsOption = {
    tooltip: {
      trigger: "item",
    },
    visualMap: {
      show: false,
      min: 80,
      max: 600,
      inRange: {
        colorLightness: [0, 1],
      },
    },
    series: [
      {
        name: "Access From",
        type: "pie",
        radius: "55%",
        center: ["50%", "50%"],
        data: [],
        roseType: "radius",
        label: {
          fontSize: 13,
        },
        labelLine: {
          smooth: 0.2,
          length: 5,
          length2: 5,
        },
        itemStyle: {
          color: "#c23531",
        },
        animationType: "scale",
        animationEasing: "elasticOut",
        animationDelay: function (idx) {
          return Math.random() * 200;
        },
      },
    ],
  };
}

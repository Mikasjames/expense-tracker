import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LineBarChartComponent } from "./line-bar-chart.component";

describe("LineChartComponent", () => {
  let component: LineBarChartComponent;
  let fixture: ComponentFixture<LineBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineBarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

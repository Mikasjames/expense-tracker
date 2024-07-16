import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DollarSignSvgsComponent } from './dollar-sign-svgs.component';

describe('DollarSignSvgsComponent', () => {
  let component: DollarSignSvgsComponent;
  let fixture: ComponentFixture<DollarSignSvgsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DollarSignSvgsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DollarSignSvgsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

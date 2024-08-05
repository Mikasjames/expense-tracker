import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformButtonsComponent } from './platform-buttons.component';

describe('PlatformButtonsComponent', () => {
  let component: PlatformButtonsComponent;
  let fixture: ComponentFixture<PlatformButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

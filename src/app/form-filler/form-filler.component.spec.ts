import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFillerComponent } from './form-filler.component';

describe('FormFillerComponent', () => {
  let component: FormFillerComponent;
  let fixture: ComponentFixture<FormFillerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFillerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFillerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionFormButtonsComponent } from './transaction-form-buttons.component';

describe('TransactionFormButtonsComponent', () => {
  let component: TransactionFormButtonsComponent;
  let fixture: ComponentFixture<TransactionFormButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionFormButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

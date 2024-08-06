import { Component, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';

@Component({
  selector: 'app-transaction-form-buttons',
  standalone: true,
  imports: [TransactionFormComponent],
  templateUrl: './transaction-form-buttons.component.html',
  styleUrl: './transaction-form-buttons.component.sass',
})
export class TransactionFormButtonsComponent {
  @ViewChild('modalTemplate') modalTemplate!: TransactionFormComponent;
  transactionType: 'income' | 'expense' = 'income';
  constructor(private ngbModal: NgbModal) {}

  openModal(transactionType: 'income' | 'expense') {
    this.transactionType = transactionType;
    this.ngbModal.open(this.modalTemplate, {
      centered: true,
      fullscreen: 'sm',
    });
  }
}

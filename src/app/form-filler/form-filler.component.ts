import { Component } from '@angular/core';
import { PdfFile, PdfService } from '../services/pdf/pdf.service';
import { CommonModule } from '@angular/common';
import {
  PDFDocument,
  PDFTextField,
  PDFForm,
  PDFNumber,
  StandardFonts,
} from 'pdf-lib';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../services/transactions/transaction.service';
import { Transaction } from '../models/transaction.interface';
import { TagService } from '../services/tags/tag.service';

@Component({
  selector: 'app-form-filler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-filler.component.html',
  styleUrl: './form-filler.component.sass',
})
export class FormFillerComponent {
  uploadedFiles: PdfFile[] | null = null;
  currentYear: number = new Date().getFullYear();
  months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  selectedMonth: string = this.months[new Date().getMonth()];
  allIns: Transaction[] = [];
  allOuts: Transaction[] = [];
  totalIns: string = '0.00';

  constructor(
    private pdfService: PdfService,
    private transactionService: TransactionService,
    private tagService: TagService,
  ) {}

  ngOnInit() {
    this.pdfService.pdfs$.subscribe((pdfs: PdfFile[]) => {
      this.uploadedFiles = pdfs;
    });

    this.transactionService.getAllTransactions().subscribe({
      next: (transactions) => {
        console.log(transactions);
        this.allOuts = transactions.expenseTransactions;
        this.allIns = transactions.incomeTransactions;
      },
      error: (error) => {
        console.error('Error fetching transactions:', error);
      },
    });
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.pdfService.uploadPdf(file).subscribe(
          (pdfFile: PdfFile) => {
            console.log(pdfFile);
          },
          (error: Error) => {
            console.error(error);
          },
        );
      } else {
        alert('Please upload a PDF file');
      }
    }
  }

  async fillForm(pdf: PdfFile) {
    console.log('Filling form:', pdf);
    const pdfUrl = pdf.url;
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch PDF file');
    }
    const arrayBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    this.modifyFont(pdfDoc);
    const form = pdfDoc.getForm();

    this.setBasicInfoFieldValues(form);
    await this.inputTransactionData(form);

    const pdfBytes = await pdfDoc.save();

    const modifiedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(modifiedBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${this.selectedMonth}_2024-${pdf.name}`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  setBasicInfoFieldValues(form: PDFForm) {
    const nameField = form.getTextField('900_1_Text_C');
    const cityField = form.getTextField('900_2_Text_C');
    const provinceField = form.getTextField('900_3_Text_C');
    const monthField = form.getTextField('900_4_Text_C');
    const yearField = form.getTextField('900_5_Text_C');

    this.manuallyModifyFont(nameField, 11.65);
    this.manuallyModifyFont(cityField, 11.65);
    this.manuallyModifyFont(provinceField, 11.65);
    this.manuallyModifyFont(monthField, 11.65);
    this.manuallyModifyFont(yearField, 11.65);

    nameField.setText('West Tanza');
    cityField.setText('Tanza');
    provinceField.setText('Cavite');
    monthField.setText(`${this.selectedMonth}`);
    yearField.setText(`${this.currentYear}`);
  }

  async inputTransactionData(form: PDFForm) {
    const ins = this.filterTransactionsByMonthYear(this.allIns);
    this.totalIns = this.aggregateTransactions(ins);
    const outs = this.filterTransactionsByMonthYear(this.allOuts);

    ins
      .sort((a, b) => {
        if (a.title < b.title) return 1;
        if (a.title > b.title) return -1;
        return 0;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    outs.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    ins.push(...outs);

    const insFieldMappings = this.createFieldMappings(ins);
    await this.fillFormFields(form, insFieldMappings);
  }

  createFieldMappings(transactions: Transaction[]): { [key: string]: string } {
    const fieldMappings: { [key: string]: string } = {};
    let depositTransactionIndex = 0;

    transactions.forEach((transaction, index) => {
      const transactionType = transaction.type;
      const dateField = `900_${index + 7}_Text_C`;
      const descriptionField = `900_${index + 59}_Text`;
      const tagField = `900_${index + 111}_Text_C`;
      const amountField = `901_${index + 1}_S26Value`;
      const outAmountField = `902_${index + 57}_S26Value`;
      const outDescriptionField = `900_${index + 62}_Text`;
      const outDateField = `900_${index + 10}_Text_C`;

      if (transactionType === 'income') {
        depositTransactionIndex = index;
        fieldMappings[dateField] = `${transaction.date.getDate()}`;
        fieldMappings[descriptionField] = transaction.title;
        fieldMappings[tagField] = this.tagService.synchronousGetTagFromId(
          transaction.tagIds[0],
          transactionType,
        ).name;
        fieldMappings[amountField] = transaction.amount.toFixed(2).toString();
      } else {
        fieldMappings[outAmountField] = transaction.amount
          .toFixed(2)
          .toString();
        fieldMappings[outDescriptionField] = transaction.title;
        fieldMappings[outDateField] = `${transaction.date.getDate()}`;
      }
    });

    fieldMappings[`900_${depositTransactionIndex + 9}_Text_C`] =
      `${new Date(this.currentYear, this.months.indexOf(this.selectedMonth) + 1, 0).getDate()}`;
    fieldMappings[`900_${depositTransactionIndex + 113}_Text_C`] = 'D';
    fieldMappings[`900_${depositTransactionIndex + 61}_Text`] =
      'Deposit to cashbox';
    fieldMappings[`901_${depositTransactionIndex + 56}_S26Value`] =
      this.totalIns;
    fieldMappings[`902_${depositTransactionIndex + 3}_S26Value`] =
      this.totalIns;

    return fieldMappings;
  }

  fillFormFields(form: PDFForm, fieldMappings: { [key: string]: string }) {
    Object.keys(fieldMappings).forEach((fieldName) => {
      const field = form.getTextField(fieldName);
      field.setText(fieldMappings[fieldName]);
    });
    const lastFieldIndex = Object.keys(fieldMappings).length;
  }

  async modifyFont(doc: PDFDocument) {
    doc
      .getForm()
      .getFields()
      .forEach((field) => {
        if (field instanceof PDFTextField) {
          field.setFontSize(10);
        }
      });
  }

  async manuallyModifyFont(field: PDFTextField, size: number) {
    field.setFontSize(size);
  }

  filterTransactionsByMonthYear(transactions: Transaction[]) {
    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return (
        date.getMonth() === this.months.indexOf(this.selectedMonth) &&
        date.getFullYear() === this.currentYear
      );
    });
  }

  aggregateTransactions(transactions: Transaction[]) {
    const total = transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );
    return total.toFixed(2);
  }
}

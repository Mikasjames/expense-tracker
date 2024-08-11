import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  Observable,
  switchMap,
} from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-form-filler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-filler.component.html',
  styleUrl: './form-filler.component.sass',
})
export class FormFillerComponent implements OnInit {
  private uploadedFilesSubject = new BehaviorSubject<PdfFile[]>([]);
  uploadedFiles$: Observable<PdfFile[]> =
    this.uploadedFilesSubject.asObservable();
  boTransactions: Transaction[] = [];

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
  name = 'West Tanza';
  city = 'Tanza';
  province = 'Cavite';
  selectedMonth: string = this.months[new Date().getMonth()];

  private transactionsSubject = new BehaviorSubject<{
    income: Transaction[];
    expense: Transaction[];
  }>({ income: [], expense: [] });
  transactions$ = this.transactionsSubject.asObservable();

  totalIns$ = this.transactions$.pipe(
    switchMap(({ income }) => this.calculateTotal(income)),
  );

  totalForwardedFromLastMonth$ = this.transactions$.pipe(
    switchMap(({ income, expense }) =>
      this.calculateTotalForwarded(income, expense),
    ),
  );

  constructor(
    private pdfService: PdfService,
    private transactionService: TransactionService,
    private tagService: TagService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadUploadedFiles();
  }

  loadTransactions() {
    combineLatest([
      this.transactionService.incomeTransactions$,
      this.transactionService.expenseTransactions$,
    ]).subscribe(([incomeTransactions, expenseTransactions]) => {
      this.transactionsSubject.next({
        income: incomeTransactions,
        expense: expenseTransactions,
      });
      this.cdr.markForCheck();
    });
  }

  loadUploadedFiles() {
    this.pdfService.pdfs$.subscribe(
      (files) => {
        this.uploadedFilesSubject.next(files);
        this.cdr.markForCheck();
      },
      (error) => {
        console.error('Error fetching uploaded files:', error);
      },
    );
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.pdfService
          .uploadPdf(file)
          .pipe(
            catchError((error) => {
              console.error('Error uploading PDF:', error);
              alert('Failed to upload PDF. Please try again.');
              return [];
            }),
          )
          .subscribe((pdfFile) => {
            const currentFiles = this.uploadedFilesSubject.value;
            this.uploadedFilesSubject.next([...currentFiles, pdfFile]);
            this.cdr.markForCheck();
          });
      } else {
        alert('Please upload a PDF file');
      }
    }
  }

  async fillForm(pdf: PdfFile) {
    const num = pdf.name.split('_')[0].split('-')[1];
    switch (num) {
      case '26':
        this.fill26(pdf);
        break;
      case '30':
        this.fill30(pdf);
        break;
      case '62':
        this.fill62(pdf);
        break;
      default:
        alert('Unsupported PDF form');
        break;
    }
  }

  async fill26(pdf: PdfFile) {
    try {
      const pdfDoc = await this.loadPdfDocument(pdf.url);
      this.modifyFont(pdfDoc);
      const form = pdfDoc.getForm();

      this.setBasic26InfoFieldValues(form);
      await this.inputTransactionData(form);

      const pdfBytes = await pdfDoc.save();
      this.downloadModifiedPdf(pdfBytes, pdf.name);
      this.boTransactions = [];
    } catch (error) {
      this.boTransactions = [];
      console.error('Error filling form:', error);
      alert('An error occurred while filling the form. Please try again.');
    }
  }

  async fill30(pdf: PdfFile) {
    const pdfDoc = await this.loadPdfDocument(pdf.url);
    this.modifyFont(pdfDoc);
    const form = pdfDoc.getForm();

    this.setBasic30InfoFieldValues(form);
    const pdfBytes = await pdfDoc.save();
    this.downloadModifiedPdf(pdfBytes, pdf.name);
  }

  async fill62(pdf: PdfFile) {
    const pdfDoc = await this.loadPdfDocument(pdf.url);
    this.modifyFont(pdfDoc);
    const form = pdfDoc.getForm();
  }

  private async loadPdfDocument(url: string): Promise<PDFDocument> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch PDF file');
    }
    const arrayBuffer = await response.arrayBuffer();
    return PDFDocument.load(arrayBuffer);
  }

  private setBasic26InfoFieldValues(form: PDFForm) {
    const fields = [
      { name: '900_1_Text_C', value: this.name },
      { name: '900_2_Text_C', value: this.city },
      { name: '900_3_Text_C', value: this.province },
      { name: '900_4_Text_C', value: this.selectedMonth },
      { name: '900_5_Text_C', value: this.currentYear.toString() },
    ];

    fields.forEach((field) => {
      const pdfField = form.getTextField(field.name);
      this.manuallyModifyFont(pdfField, 11.65);
      pdfField.setText(field.value);
    });
  }

  private setBasic30InfoFieldValues(form: PDFForm) {
    const inW: Transaction[] = [];
    const inC: Transaction[] = [];
    this.transactionsSubject.value.income.forEach((transaction) => {
      const tag = this.tagService.synchronousGetTagFromId(
        transaction.tagIds[0],
        'income',
      );
      if (tag.name === 'W') {
        inW.push(transaction);
      } else if (tag.name === 'C') {
        inC.push(transaction);
      }
    });
    const cForSelectedMonthYear = this.filterTransactionsByMonthYear(inC);

    const fields = [
      { name: '900_1_Text', value: this.name },
      {
        name: '900_2_Text',
        value: `${this.selectedMonth} ${this.currentYear}`,
      },
      { name: '900_17_Text_C', value: this.selectedMonth },
    ];

    this.totalForwardedFromLastMonth$.pipe(take(1)).subscribe((total) => {
      fields.push({ name: '901_1_S30_Value', value: total });
    });
    this.calculateTotal(cForSelectedMonthYear)
      .pipe(take(1))
      .subscribe((total) => {
        fields.push({ name: '901_2_S30_Value', value: total });
      });
    this.transactions$.pipe(take(1)).subscribe(({ expense }) => {
      const outsForSelectedMonthYear =
        this.filterTransactionsByMonthYear(expense);
      outsForSelectedMonthYear.forEach((transaction) => {
        if (transaction.title.includes('KHOC')) {
          fields.push({
            name: '901_12_S30_Value',
            value: transaction.amount.toFixed(2).toString(),
          });
          outsForSelectedMonthYear.splice(
            outsForSelectedMonthYear.indexOf(transaction),
            1,
          );
        }
      });

      this.boTransactions.forEach((transaction) => {
        if (transaction.title.includes('resolution')) {
          fields.push({
            name: '901_13_S30_Value',
            value: transaction.amount.toFixed(2).toString(),
          });
        }
        if (transaction.title.includes('from Box')) {
          fields.push({
            name: '901_7_S30_Value',
            value: transaction.amount.toFixed(2).toString(),
          });
          fields.push({
            name: '901_20_S30_Value',
            value: transaction.amount.toFixed(2).toString(),
          });
        }
      });
      this.calculateTotal(outsForSelectedMonthYear)
        .pipe(take(1))
        .subscribe((total) => {
          fields.push({
            name: '900_7_Text',
            value: `Expenses - Refer to ${this.uploadedFilesSubject.value[0].name.split('_')[0]}`,
          });
          fields.push({ name: '901_14_S30_Value', value: total });
        });
    });

    fields.forEach((field) => {
      const pdfField = form.getTextField(field.name);
      this.manuallyModifyFont(pdfField, 11.65);
      pdfField.setText(field.value);
    });
  }

  private async inputTransactionData(form: PDFForm) {
    const { income, expense } = this.transactionsSubject.value;
    const filteredIncome = this.filterTransactionsByMonthYear(
      income,
      'income',
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
    const filteredExpense = this.filterTransactionsByMonthYear(expense).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    const sortedTransactions = [...filteredIncome, ...filteredExpense];

    const fieldMappings = this.createFieldMappings(sortedTransactions);
    this.fillFormFields(form, fieldMappings);
  }

  private filterTransactionsByMonthYear(
    transactions: Transaction[],
    type?: 'income' | 'expense',
  ): Transaction[] {
    this.boTransactions = [];
    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      const isWithinMonthYear =
        date.getMonth() === this.months.indexOf(this.selectedMonth) &&
        date.getFullYear() === this.currentYear;
      if (!type && transaction.title.includes('WWW') && isWithinMonthYear) {
        this.boTransactions.push(transaction);
        return false;
      }
      return isWithinMonthYear;
    });
  }

  private createFieldMappings(transactions: Transaction[]): {
    [key: string]: string;
  } {
    const fieldMappings: { [key: string]: string } = {};
    let depositTransactionIndex = 0;
    let outTransactionIndex = 0;

    transactions.forEach((transaction, index) => {
      const isIncome = transaction.type === 'income';
      const dateField = isIncome
        ? `900_${index + 7}_Text_C`
        : `900_${index + 10}_Text_C`;
      const descriptionField = isIncome
        ? `900_${index + 59}_Text`
        : `900_${index + 62}_Text`;
      const amountField = isIncome
        ? `901_${index + 1}_S26Value`
        : `902_${index + 57}_S26Value`;

      fieldMappings[dateField] = transaction.date.getDate().toString();
      fieldMappings[descriptionField] = transaction.title;
      fieldMappings[amountField] = transaction.amount.toFixed(2);

      if (isIncome) {
        depositTransactionIndex = index;
        const tagField = `900_${index + 111}_Text_C`;
        fieldMappings[tagField] = this.tagService.synchronousGetTagFromId(
          transaction.tagIds[0],
          'income',
        ).name;
      } else {
        outTransactionIndex = index;
      }
    });

    // Set last day of the month for deposit
    const lastDayOfMonth = new Date(
      this.currentYear,
      this.months.indexOf(this.selectedMonth) + 1,
      0,
    ).getDate();
    fieldMappings[`900_${depositTransactionIndex + 9}_Text_C`] =
      lastDayOfMonth.toString();

    // Set deposit details
    fieldMappings[`900_${depositTransactionIndex + 113}_Text_C`] = 'D';
    fieldMappings[`900_${depositTransactionIndex + 61}_Text`] =
      'Deposit to cashbox';

    // Calculate and set total ins
    const totalIns = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
    fieldMappings[`901_${depositTransactionIndex + 56}_S26Value`] = totalIns;
    fieldMappings[`902_${depositTransactionIndex + 3}_S26Value`] = totalIns;

    // Set 'To Branch Office' description
    if (this.boTransactions.length > 0) {
      fieldMappings[`900_${outTransactionIndex + 64}_Text`] =
        'To Branch Office';
    }

    // Handle Branch Office (WWW) transactions
    this.boTransactions.forEach((transaction, index) => {
      fieldMappings[`900_${outTransactionIndex + index + 13}_Text_C`] =
        transaction.date.getDate().toString();
      fieldMappings[`900_${outTransactionIndex + index + 65}_Text`] =
        transaction.title;
      fieldMappings[`902_${outTransactionIndex + index + 60}_S26Value`] =
        transaction.amount.toFixed(2);
    });

    // Set total forwarded from last month
    this.totalForwardedFromLastMonth$.pipe(take(1)).subscribe((total) => {
      fieldMappings[`904_24_S26Amount`] = total;
      fieldMappings[`904_33_S26Amount`] = total;
    });

    return fieldMappings;
  }

  private fillFormFields(
    form: PDFForm,
    fieldMappings: { [key: string]: string },
  ) {
    Object.entries(fieldMappings).forEach(([fieldName, value]) => {
      const field = form.getTextField(fieldName);
      field.setText(value);
    });
  }

  private modifyFont(doc: PDFDocument) {
    doc
      .getForm()
      .getFields()
      .forEach((field) => {
        if (field instanceof PDFTextField) {
          field.setFontSize(10);
        }
      });
  }

  private manuallyModifyFont(field: PDFTextField, size: number) {
    field.setFontSize(size);
  }

  private calculateTotal(transactions: Transaction[]): Observable<string> {
    return new Observable((observer) => {
      const total = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );
      observer.next(total.toFixed(2));
      observer.complete();
    });
  }

  private calculateTotalForwarded(
    income: Transaction[],
    expense: Transaction[],
  ): Observable<string> {
    return new Observable((observer) => {
      const filteredIncome = this.filterPreviousMonthsTransactions(income);
      const filteredExpense = this.filterPreviousMonthsTransactions(expense);

      const totalIncome = filteredIncome.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );
      const totalExpense = filteredExpense.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );

      const totalForwarded = (totalIncome - totalExpense).toFixed(2);
      observer.next(totalForwarded);
      observer.complete();
    });
  }

  private filterPreviousMonthsTransactions(
    transactions: Transaction[],
  ): Transaction[] {
    const currentMonth = this.months.indexOf(this.selectedMonth);
    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return (
        date.getMonth() < currentMonth &&
        date.getFullYear() === this.currentYear
      );
    });
  }

  private downloadModifiedPdf(pdfBytes: Uint8Array, originalName: string) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.selectedMonth}_${this.currentYear}-${originalName}`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

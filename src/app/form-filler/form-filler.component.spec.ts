import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

import { FormFillerComponent } from './form-filler.component';
import { PdfFile, PdfService } from '../services/pdf/pdf.service';
import { TransactionService } from '../services/transactions/transaction.service';
import { TagService } from '../services/tags/tag.service';
import { Transaction } from '../models/transaction.interface';
import { createTransactionServiceStub } from '../testing/service-stubs';

const pdfLibMocks = vi.hoisted(() => {
  class PDFTextField {
    setFontSize() {}
    setText() {}
    getName() {
      return 'field';
    }
  }
  class PDFCheckBox {
    check() {}
  }
  const textField = new PDFTextField();
  const checkBox = new PDFCheckBox();
  const otherField = { getName: (): string => 'other' };
  const form = {
    getTextField: vi.fn(() => textField),
    getCheckBox: vi.fn(() => checkBox),
    getFields: vi.fn(() => [textField, otherField]),
  };
  const doc = {
    getForm: vi.fn(() => form),
    save: vi.fn(async () => new Uint8Array([1, 2, 3])),
  };
  return {
    PDFDocument: { load: vi.fn(async () => doc) },
    PDFTextField,
    PDFCheckBox,
  };
});

vi.mock('pdf-lib', () => ({
  PDFDocument: pdfLibMocks.PDFDocument,
  PDFTextField: pdfLibMocks.PDFTextField,
  PDFCheckBox: pdfLibMocks.PDFCheckBox,
}));

function transaction(overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'title' | 'amount' | 'type'>): Transaction {
  return {
    userId: 'u1',
    description: '',
    date: new Date(),
    tagIds: ['t1'],
    ...overrides,
  };
}

function pdfFile(name: string): PdfFile {
  return { id: 'f1', name, size: 100, createdAt: new Date() };
}

async function flushAsync() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe('FormFillerComponent', () => {
  let component: FormFillerComponent;
  let fixture: ComponentFixture<FormFillerComponent>;
  let transactionStub: ReturnType<typeof createTransactionServiceStub>;
  let pdfsSubject: BehaviorSubject<any[]>;
  let pdfStub: {
    pdfs$: Observable<any[]>;
    getDownloadUrl: ReturnType<typeof vi.fn>;
    uploadPdf: ReturnType<typeof vi.fn>;
  };
  let tagStub: { synchronousGetTagFromId: ReturnType<typeof vi.fn> };
  let fetchMock: ReturnType<typeof vi.fn>;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  beforeEach(async () => {
    transactionStub = createTransactionServiceStub();
    pdfsSubject = new BehaviorSubject<any[]>([]);
    pdfStub = {
      pdfs$: pdfsSubject.asObservable(),
      getDownloadUrl: vi.fn(
        () =>
          new BehaviorSubject({ downloadUrl: 'https://example.com/file.pdf' })
            .asObservable(),
      ),
      uploadPdf: vi.fn(
        () =>
          new BehaviorSubject({ id: 'f1', name: 'form-26.pdf' }).asObservable(),
      ),
    };
    tagStub = {
      synchronousGetTagFromId: vi.fn(
        (tagId: string) =>
          ({ name: tagId === 'w' ? 'W' : tagId === 'c' ? 'C' : 'Salary' }) as any,
      ),
    };
    fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]),
    }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [FormFillerComponent],
      providers: [
        { provide: PdfService, useValue: pdfStub },
        { provide: TransactionService, useValue: transactionStub },
        { provide: TagService, useValue: tagStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFillerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds the year range from transactions', () => {
    transactionStub._expense.next([
      transaction({ id: 'e1', title: 'New', amount: 1, type: 'expense', date: new Date(2022, 5, 1) }),
    ]);
    transactionStub._income.next([
      transaction({ id: 'i1', title: 'Old', amount: 1, type: 'income', date: new Date(2020, 5, 1) }),
    ]);
    expect(component.oldestToNewestTransactionYearRange).toEqual([
      2020, 2021, 2022,
    ]);
    expect(component.selectedYear).toBe(2022);
  });

  it('does not set a year range without transactions', () => {
    transactionStub._income.next([]);
    transactionStub._expense.next([]);
    expect(component.oldestToNewestTransactionYearRange).toEqual([]);
  });

  it('onYearChange updates the selected year', () => {
    component.onYearChange('2024');
    expect(component.selectedYear).toBe(2024);
    component.onYearChange(2023);
    expect(component.selectedYear).toBe(2023);
  });

  it('onYearChange ignores nullish values', () => {
    component.onYearChange(null);
    expect(component.selectedYear).toBe(thisYear);
    component.onYearChange(undefined);
    expect(component.selectedYear).toBe(thisYear);
  });

  it('logs an error when the uploaded files stream fails', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    pdfsSubject.error(new Error('boom'));
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching uploaded files:',
      expect.any(Error),
    );
    consoleError.mockRestore();
  });

  it('uploadFile does nothing without files', () => {
    const alertSpy = vi.spyOn(window, 'alert');
    component.uploadFile({ target: { files: [] } } as unknown as Event);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(pdfStub.uploadPdf).not.toHaveBeenCalled();
  });

  it('uploadFile alerts when the file is not a PDF', () => {
    const alertSpy = vi.spyOn(window, 'alert');
    component.uploadFile({
      target: { files: [{ type: 'text/plain' }] },
    } as unknown as Event);
    expect(alertSpy).toHaveBeenCalledWith('Please upload a PDF file');
    expect(pdfStub.uploadPdf).not.toHaveBeenCalled();
  });

  it('uploadFile adds a successfully uploaded PDF', () => {
    component.uploadFile({
      target: { files: [{ type: 'application/pdf' }] },
    } as unknown as Event);
    expect(pdfStub.uploadPdf).toHaveBeenCalled();
    expect(component['uploadedFilesSubject'].value).toHaveLength(1);
  });

  it('uploadFile alerts and drops the file on upload error', () => {
    const alertSpy = vi.spyOn(window, 'alert');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    pdfStub.uploadPdf.mockReturnValue(
      throwError(() => new Error('upload failed')),
    );
    component.uploadFile({
      target: { files: [{ type: 'application/pdf' }] },
    } as unknown as Event);
    expect(consoleError).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      'Failed to upload PDF. Please try again.',
    );
    consoleError.mockRestore();
  });

  it('fillForm alerts for unsupported PDF forms', async () => {
    const alertSpy = vi.spyOn(window, 'alert');
    await component.fillForm(pdfFile('form-99_report.pdf'));
    expect(alertSpy).toHaveBeenCalledWith('Unsupported PDF form');
  });

  it('fillForm 26 fills and downloads the form', async () => {
    component.selectedMonth = 'February';
    component.selectedYear = 2024;
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'Pay',
        amount: 100,
        type: 'income',
        tagIds: ['w'],
        date: new Date(2024, 1, 10),
      }),
      transaction({
        id: 'i2',
        title: 'Deposit',
        amount: 50,
        type: 'income',
        tagIds: ['w'],
        date: new Date(2024, 1, 12),
      }),
      transaction({
        id: 'ip',
        title: 'Prev Income',
        amount: 200,
        type: 'income',
        tagIds: ['w'],
        date: new Date(2024, 0, 5),
      }),
    ]);
    transactionStub._expense.next([
      transaction({
        id: 'e1',
        title: 'Rent',
        amount: 30,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 5),
      }),
      transaction({
        id: 'e2',
        title: 'WWW transfer',
        amount: 20,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 6),
      }),
      transaction({
        id: 'e3',
        title: 'Utilities',
        amount: 15,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 7),
      }),
      transaction({
        id: 'ep',
        title: 'Prev Exp',
        amount: 10,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 0, 6),
      }),
    ]);
    await component.fillForm(pdfFile('form-26_report.pdf'));
    await flushAsync();
    expect(pdfLibMocks.PDFDocument.load).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(component.boTransactions).toEqual([]);
  });

  it('totalIns$ sums the income transactions', () => {
    transactionStub._income.next([
      transaction({ id: 'i1', title: 'A', amount: 10, type: 'income' }),
      transaction({ id: 'i2', title: 'B', amount: 5, type: 'income' }),
    ]);
    let total: string | undefined;
    component.totalIns$.subscribe((t) => (total = t));
    expect(total).toBe('15.00');
  });

  it('fillForm 26 handles a form without branch office transactions', async () => {
    component.selectedMonth = 'February';
    component.selectedYear = 2024;
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'Pay',
        amount: 100,
        type: 'income',
        tagIds: ['w'],
        date: new Date(2024, 1, 10),
      }),
    ]);
    transactionStub._expense.next([
      transaction({
        id: 'e1',
        title: 'Rent',
        amount: 30,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 5),
      }),
    ]);
    await component.fillForm(pdfFile('form-26_report.pdf'));
    await flushAsync();
    expect(pdfLibMocks.PDFDocument.load).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('fillForm 26 alerts when the PDF cannot be loaded', async () => {
    const alertSpy = vi.spyOn(window, 'alert');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false });
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'Pay',
        amount: 100,
        type: 'income',
        date: new Date(thisYear, thisMonth, 10),
      }),
    ]);
    await component.fillForm(pdfFile('form-26_report.pdf'));
    await flushAsync();
    expect(consoleError).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      'An error occurred while filling the form. Please try again.',
    );
    consoleError.mockRestore();
  });

  it('fillForm 30 fills and downloads the form', async () => {
    component.selectedMonth = 'February';
    component.selectedYear = 2024;
    pdfsSubject.next([{ id: 'f1', name: 'form-30.pdf' }]);
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'Cash',
        amount: 100,
        type: 'income',
        tagIds: ['c'],
        date: new Date(2024, 1, 10),
      }),
      transaction({
        id: 'i2',
        title: 'Wage',
        amount: 200,
        type: 'income',
        tagIds: ['w'],
        date: new Date(2024, 1, 11),
      }),
      transaction({
        id: 'i3',
        title: 'Misc',
        amount: 50,
        type: 'income',
        tagIds: ['salary'],
        date: new Date(2024, 1, 12),
      }),
    ]);
    transactionStub._expense.next([
      transaction({
        id: 'e4',
        title: 'Misc expense',
        amount: 12,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 8),
      }),
      transaction({
        id: 'e1',
        title: 'KHOC water',
        amount: 30,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 5),
      }),
      transaction({
        id: 'e2',
        title: 'WWW resolution',
        amount: 40,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 6),
      }),
      transaction({
        id: 'e3',
        title: 'WWW from Box',
        amount: 25,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 7),
      }),
    ]);
    await component.fillForm(pdfFile('form-30_report.pdf'));
    await flushAsync();
    expect(pdfLibMocks.PDFDocument.load).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(component.boTransactions).toEqual([]);
  });

  it('fillForm 62 fills and downloads the form without a resolution', async () => {
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'WWW salary',
        amount: 100,
        type: 'income',
        tagIds: ['w'],
        date: new Date(thisYear, thisMonth, 10),
      }),
    ]);
    await component.fillForm(pdfFile('form-62_report.pdf'));
    await flushAsync();
    expect(pdfLibMocks.PDFDocument.load).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(component.boTransactions).toEqual([]);
  });

  it('fillForm 62 fills the resolution field when present', async () => {
    component.selectedMonth = 'February';
    component.selectedYear = 2024;
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'WWW salary',
        amount: 100,
        type: 'income',
        tagIds: ['w'],
        date: new Date(2024, 1, 10),
      }),
    ]);
    transactionStub._expense.next([
      transaction({
        id: 'e1',
        title: 'WWW resolution',
        amount: 250,
        type: 'expense',
        tagIds: ['e'],
        date: new Date(2024, 1, 11),
      }),
    ]);
    await component.fillForm(pdfFile('form-62_report.pdf'));
    await flushAsync();
    expect(pdfLibMocks.PDFDocument.load).toHaveBeenCalled();
    expect(component.boTransactions).toEqual([]);
  });

  it('fillForm 62 ignores income transactions without a W tag', async () => {
    component.selectedMonth = 'February';
    component.selectedYear = 2024;
    transactionStub._income.next([
      transaction({
        id: 'i1',
        title: 'Salary',
        amount: 100,
        type: 'income',
        tagIds: ['c'],
        date: new Date(2024, 1, 10),
      }),
    ]);
    await component.fillForm(pdfFile('form-62_report.pdf'));
    await flushAsync();
    expect(pdfLibMocks.PDFDocument.load).toHaveBeenCalled();
  });
});

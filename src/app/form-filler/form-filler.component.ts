import { Component } from '@angular/core';
import { PdfFile, PdfService } from '../services/pdf/pdf.service';
import { CommonModule } from '@angular/common';
import { PDFDocument, PDFTextField, PDFForm } from 'pdf-lib';

@Component({
  selector: 'app-form-filler',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-filler.component.html',
  styleUrl: './form-filler.component.sass',
})
export class FormFillerComponent {
  uploadedFiles: PdfFile[] | null = null;

  constructor(private pdfService: PdfService) {}

  ngOnInit() {
    this.pdfService.pdfs$.subscribe((pdfs: PdfFile[]) => {
      console.log(pdfs);
      this.uploadedFiles = pdfs;
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
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(fields);

    this.setBasicInfoFieldValues(form);

    const pdfBytes = await pdfDoc.save();

    fields.forEach((field) => {
      console.log(field.getName());
    });

    const modifiedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(modifiedBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `July_2024-${pdf.name}`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  setBasicInfoFieldValues(form: PDFForm) {
    form.getTextField('900_1_Text_C').setText('West Tanza');
    form.getTextField('900_2_Text_C').setText('Tanza');
    form.getTextField('900_3_Text_C').setText('Cavite');
    form.getTextField('900_4_Text_C').setText('July');
    form.getTextField('900_5_Text_C').setText('2024');
  }
}

import { Component } from '@angular/core';
import { PdfFile, PdfService } from '../services/pdf/pdf.service';
import { CommonModule } from '@angular/common';

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

  fillForm(pdf: PdfFile) {
    console.log('Filling form:', pdf);
  }
}

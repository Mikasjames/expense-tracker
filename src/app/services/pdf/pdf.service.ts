import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  deleteDoc,
  setDoc,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  from,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PdfFile {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private pdfsSubject = new BehaviorSubject<PdfFile[]>([]);
  pdfs$ = this.pdfsSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
  ) {
    this.initialize();
  }

  private initialize() {
    user(this.auth)
      .pipe(
        switchMap((firebaseUser) => {
          if (!firebaseUser) {
            return of([]);
          }
          return this.getPdfsFromFirestore(firebaseUser.uid);
        }),
      )
      .subscribe({
        next: (pdfs) => this.pdfsSubject.next(pdfs),
        error: (err) => console.error('Error loading PDFs:', err),
      });
  }

  private getPdfsFromFirestore(uid: string): Observable<PdfFile[]> {
    const pdfsCollection = collection(
      this.firestore,
      `pdfs/${uid}/userPdfs`,
    );
    return collectionData(pdfsCollection, { idField: 'id' }) as Observable<PdfFile[]>;
  }

  private async getAuthToken(): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return currentUser.getIdToken();
  }

  private async requestWorker(
    path: string,
    options: RequestInit = {},
  ): Promise<any> {
    const token = await this.getAuthToken();
    const response = await fetch(new URL(path, environment.workerUrl).toString(), {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Worker request failed: ${response.status}`);
    }

    return response.json();
  }

  uploadPdf(file: File): Observable<PdfFile> {
    return from(this.uploadPdfAsync(file));
  }

  private async uploadPdfAsync(file: File): Promise<PdfFile> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const { fileId, uploadUrl } = await this.requestWorker('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/pdf',
      }),
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/pdf' },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    const pdfData: PdfFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      createdAt: new Date(),
    };

    const pdfRef = doc(
      this.firestore,
      `pdfs/${currentUser.uid}/userPdfs/${fileId}`,
    );
    await setDoc(pdfRef, pdfData);

    const current = this.pdfsSubject.value;
    this.pdfsSubject.next([...current, pdfData]);

    return pdfData;
  }

  getAllPdfs(): Observable<PdfFile[]> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return of([]);
    }
    return this.getPdfsFromFirestore(currentUser.uid);
  }

  getDownloadUrl(fileId: string): Observable<{ downloadUrl: string }> {
    return from(this.requestWorker(`/api/downloads/${fileId}`));
  }

  deletePdf(pdfFile: PdfFile): Observable<void> {
    return from(this.deletePdfAsync(pdfFile));
  }

  private async deletePdfAsync(pdfFile: PdfFile): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    await this.requestWorker(`/api/uploads/${pdfFile.id}`, {
      method: 'DELETE',
    });

    const pdfRef = doc(
      this.firestore,
      `pdfs/${currentUser.uid}/userPdfs/${pdfFile.id}`,
    );
    await deleteDoc(pdfRef);

    const current = this.pdfsSubject.value;
    this.pdfsSubject.next(current.filter((p) => p.id !== pdfFile.id));
  }
}

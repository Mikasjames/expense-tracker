import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  from,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';

export interface PdfFile {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private readonly PDF_COLLECTION = 'pdfs';
  private readonly PDF_STORAGE_PATH = 'pdfs';
  private userId: string | null = null;
  private pdfsSubject = new BehaviorSubject<PdfFile[]>([]);
  pdfs$ = this.pdfsSubject.asObservable();

  constructor(
    private storage: AngularFireStorage,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
  ) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        console.log(user);
        this.userId = user.uid;
        this.getAllPdfs().subscribe((pdfs) => {
          this.pdfsSubject.next(pdfs);
        });
      } else {
        this.userId = null;
        this.pdfsSubject.next([]);
      }
    });
  }

  uploadPdf(file: File): Observable<PdfFile> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const filePath = `${this.PDF_STORAGE_PATH}/${this.userId}/userPdfs/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return task.snapshotChanges().pipe(
      switchMap(() => fileRef.getDownloadURL()),
      switchMap((url) =>
        from(fileRef.getMetadata()).pipe(
          map((metadata) => ({
            id: metadata.name,
            name: file.name,
            url: url,
            createdAt: new Date(metadata.timeCreated),
          })),
        ),
      ),
      switchMap((pdfFile) =>
        this.getAllPdfs().pipe(
          map((pdfs) => {
            this.pdfsSubject.next([...pdfs, pdfFile]);
            return pdfFile;
          }),
        ),
      ),
    );
  }

  getAllPdfs(): Observable<PdfFile[]> {
    if (!this.userId) {
      return of([]);
    }

    const pdfsPath = `${this.PDF_STORAGE_PATH}/${this.userId}/userPdfs`;

    return from(this.storage.storage.ref().child(pdfsPath).listAll()).pipe(
      switchMap((res) => {
        const items = res.items;
        const metadataPromises = items.map((itemRef) =>
          from(itemRef.getMetadata()).pipe(
            switchMap((metadata) =>
              from(itemRef.getDownloadURL()).pipe(
                map((url) => ({
                  id: metadata.name,
                  name: metadata.name,
                  url: url,
                  createdAt: new Date(metadata.timeCreated),
                })),
              ),
            ),
          ),
        );
        return forkJoin(metadataPromises);
      }),
    );
  }

  getPdfById(id: string): Observable<PdfFile | undefined> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    return this.firestore
      .collection(this.PDF_COLLECTION)
      .doc(this.userId)
      .collection('userPdfs')
      .doc<PdfFile>(id)
      .valueChanges();
  }

  deletePdf(pdfFile: PdfFile): Observable<void> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const storagePath = this.storage.refFromURL(pdfFile.url);
    return forkJoin([
      from(
        this.firestore
          .collection(this.PDF_COLLECTION)
          .doc(this.userId)
          .collection('userPdfs')
          .doc(pdfFile.id)
          .delete(),
      ),
      from(storagePath.delete()),
    ]).pipe(
      switchMap(() => this.getAllPdfs()),
      map((pdfs) => {
        this.pdfsSubject.next(pdfs);
        return undefined;
      }),
    );
  }
}

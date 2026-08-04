import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PdfService } from './pdf.service';
import { AUTH, FIRESTORE, FirebaseService } from '../firebase/firebase.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AUTH,
          useFactory: (fb: FirebaseService) => fb.auth,
          deps: [FirebaseService],
        },
        {
          provide: FIRESTORE,
          useFactory: (fb: FirebaseService) => fb.fs,
          deps: [FirebaseService],
        },
      ],
    });

    service = TestBed.inject(PdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

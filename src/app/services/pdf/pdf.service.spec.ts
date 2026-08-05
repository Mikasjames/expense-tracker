const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => ({ collection: true })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({ ref: 'doc' })),
  setDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: firestoreMocks.doc,
  setDoc: firestoreMocks.setDoc,
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';

import { PdfService, PdfFile } from './pdf.service';
import { AUTH, FIRESTORE, FirebaseService } from '../firebase/firebase.service';
import {
  createFirebaseServiceStub,
  FirebaseServiceStub,
} from '../../testing/service-stubs';

function latest<T>(observable: Observable<T>): T {
  let value: T | undefined;
  observable.subscribe((v) => (value = v)).unsubscribe();
  return value as T;
}

interface FetchResponse {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}

function okJson(data: unknown): FetchResponse {
  return { ok: true, status: 200, json: () => Promise.resolve(data) };
}

function failJson(error: string, status = 500): FetchResponse {
  return { ok: false, status, json: () => Promise.resolve({ error }) };
}

function failNoBody(status = 500): FetchResponse {
  return {
    ok: false,
    status,
    json: () => Promise.reject(new Error('no body')),
  };
}

describe('PdfService', () => {
  let service: PdfService;
  let fb: FirebaseServiceStub;
  let authToken: {
    currentUser: {
      uid: string;
      getIdToken: ReturnType<typeof vi.fn>;
    } | null;
  };
  let fetchMock: ReturnType<typeof vi.fn>;

  const pdfFile: PdfFile = { id: 'f1', name: 'a.pdf', size: 10, createdAt: new Date() };

  beforeEach(() => {
    Object.values(firestoreMocks).forEach((fn) =>
      (fn as ReturnType<typeof vi.fn>).mockClear(),
    );
    fb = createFirebaseServiceStub();
    authToken = {
      currentUser: { uid: 'u1', getIdToken: vi.fn(() => Promise.resolve('token')) },
    };
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH, useValue: authToken },
        { provide: FIRESTORE, useValue: {} },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(PdfService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('loads pdfs for the signed-in user', () => {
      const pdfs = [pdfFile];
      (fb._collectionData as { next: (v: unknown) => void }).next(pdfs);
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });

      expect(latest(service.pdfs$)).toEqual(pdfs);
    });

    it('starts empty when signed out', () => {
      expect(latest(service.pdfs$)).toEqual([]);
    });

    it('logs an error when the user stream fails', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (fb._user as { error: (e: unknown) => void }).error(new Error('boom'));
      expect(consoleError).toHaveBeenCalledWith(
        'Error loading PDFs:',
        expect.any(Error),
      );
      consoleError.mockRestore();
    });
  });

  describe('uploadPdf', () => {
    const file = new File(['data'], 'a.pdf', { type: 'application/pdf' });

    it('throws when the user is not authenticated', async () => {
      authToken.currentUser = null;
      await expect(firstValueFrom(service.uploadPdf(file))).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('uploads a file and stores the pdf record', async () => {
      fetchMock
        .mockResolvedValueOnce(okJson({ fileId: 'f1', uploadUrl: 'https://upload' }))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await firstValueFrom(service.uploadPdf(file));

      expect(authToken.currentUser?.getIdToken).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://pdf-storage-proxy.mikasjames.workers.dev/api/uploads',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ fileName: 'a.pdf', contentType: 'application/pdf' }),
        }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://upload',
        expect.objectContaining({ method: 'PUT', body: file }),
      );
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        expect.objectContaining({ id: 'f1', name: 'a.pdf' }),
      );
      expect(result.id).toBe('f1');
      expect(latest(service.pdfs$)).toEqual([expect.objectContaining({ id: 'f1' })]);
    });

    it('throws when the worker request fails', async () => {
      fetchMock.mockResolvedValueOnce(failJson('Worker exploded'));

      await expect(firstValueFrom(service.uploadPdf(file))).rejects.toThrow(
        'Worker exploded',
      );
    });

    it('throws a generic error when the worker failure has no body', async () => {
      fetchMock.mockResolvedValueOnce(failNoBody(502));

      await expect(firstValueFrom(service.uploadPdf(file))).rejects.toThrow(
        'Worker request failed: 502',
      );
    });

    it('throws when the file upload fails', async () => {
      fetchMock
        .mockResolvedValueOnce(okJson({ fileId: 'f1', uploadUrl: 'https://upload' }))
        .mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(firstValueFrom(service.uploadPdf(file))).rejects.toThrow(
        'Failed to upload file to storage',
      );
    });

    it('falls back to application/pdf when the file type is empty', async () => {
      const emptyTypeFile = new File(['data'], 'a.pdf');
      fetchMock
        .mockResolvedValueOnce(okJson({ fileId: 'f2', uploadUrl: 'https://upload' }))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      await firstValueFrom(service.uploadPdf(emptyTypeFile));

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://pdf-storage-proxy.mikasjames.workers.dev/api/uploads',
        expect.objectContaining({
          body: JSON.stringify({
            fileName: 'a.pdf',
            contentType: 'application/pdf',
          }),
        }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://upload',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/pdf' },
        }),
      );
    });
  });

  describe('getAllPdfs', () => {
    it('returns an empty observable when signed out', () => {
      authToken.currentUser = null;
      let received: PdfFile[] | undefined;
      service.getAllPdfs().subscribe((p) => (received = p));
      expect(received).toEqual([]);
    });

    it('returns pdfs for the current user', () => {
      const pdfs = [pdfFile];
      (fb._collectionData as { next: (v: unknown) => void }).next(pdfs);
      let received: PdfFile[] | undefined;
      service.getAllPdfs().subscribe((p) => (received = p));
      expect(received).toEqual(pdfs);
    });
  });

  describe('getDownloadUrl', () => {
    it('throws when there is no authenticated user', async () => {
      authToken.currentUser = null;
      await expect(firstValueFrom(service.getDownloadUrl('f1'))).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('requests the download url from the worker', async () => {
      fetchMock.mockResolvedValueOnce(okJson({ downloadUrl: 'https://dl' }));

      const result = await firstValueFrom(service.getDownloadUrl('f1'));

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pdf-storage-proxy.mikasjames.workers.dev/api/downloads/f1',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        }),
      );
      expect(result).toEqual({ downloadUrl: 'https://dl' });
    });
  });

  describe('deletePdf', () => {
    it('throws when the user is not authenticated', async () => {
      authToken.currentUser = null;
      await expect(firstValueFrom(service.deletePdf(pdfFile))).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('deletes the file and removes it from the stream', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });
      (fb._collectionData as { next: (v: unknown) => void }).next([pdfFile]);
      (fb._user as { next: (v: unknown) => void }).next({ uid: 'u1' });

      await firstValueFrom(service.deletePdf(pdfFile));

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pdf-storage-proxy.mikasjames.workers.dev/api/uploads/f1',
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ ref: 'doc' });
      expect(latest(service.pdfs$)).toEqual([]);
    });
  });
});

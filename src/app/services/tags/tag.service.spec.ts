const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-tag' })),
  arrayRemove: vi.fn((v: unknown) => ['remove', v]),
  arrayUnion: vi.fn((v: unknown) => ['union', v]),
  collection: vi.fn(() => ({ collection: true })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({ ref: 'doc' })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  arrayRemove: firestoreMocks.arrayRemove,
  arrayUnion: firestoreMocks.arrayUnion,
  collection: firestoreMocks.collection,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  updateDoc: firestoreMocks.updateDoc,
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { TagService } from './tag.service';
import { FIRESTORE, FirebaseService } from '../firebase/firebase.service';
import {
  createFirebaseServiceStub,
  FirebaseServiceStub,
} from '../../testing/service-stubs';
import { Tag } from '../../models/chart.interface';

function tag(partial: Partial<Tag> = {}): Tag {
  return { id: 'x', name: 'X', type: 'income', ...partial };
}

function latest<T>(observable: { subscribe: (v: (t: T) => void) => { unsubscribe: () => void } }): T {
  let value: T | undefined;
  observable.subscribe((v) => (value = v)).unsubscribe();
  return value as T;
}

describe('TagService', () => {
  let service: TagService;
  let fb: FirebaseServiceStub;

  beforeEach(() => {
    Object.values(firestoreMocks).forEach((fn) =>
      (fn as ReturnType<typeof vi.fn>).mockClear(),
    );
    fb = createFirebaseServiceStub();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: {} },
        { provide: FirebaseService, useValue: fb },
      ],
    });
    service = TestBed.inject(TagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('separates tags by type when a user signs in', () => {
      const tags = [tag({ id: 'i', type: 'income' }), tag({ id: 'e', type: 'expense' })];
      (fb._collectionData as { next: (v: unknown) => void }).next(tags);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      expect(latest(service.incomeTags$)).toEqual([tags[0]]);
      expect(latest(service.expenseTags$)).toEqual([tags[1]]);
    });

    it('clears tags when signed out', () => {
      (fb._collectionData as { next: (v: unknown) => void }).next([
        tag({ id: 'i', type: 'income' }),
      ]);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      (fb._authState as { next: (v: unknown) => void }).next(null);

      expect(latest(service.incomeTags$)).toEqual([]);
      expect(latest(service.expenseTags$)).toEqual([]);
    });
  });

  describe('getTagFromId', () => {
    it('returns the matching tag from the right type stream', () => {
      service.separateTagsByType([
        tag({ id: 'i1', name: 'Income', type: 'income' }),
        tag({ id: 'e1', name: 'Expense', type: 'expense' }),
      ]);

      let incomeTag: Tag | undefined;
      service.getTagFromId('i1', 'income').subscribe((t) => (incomeTag = t));
      expect(incomeTag).toEqual(tag({ id: 'i1', name: 'Income', type: 'income' }));

      let expenseTag: Tag | undefined;
      service.getTagFromId('e1', 'expense').subscribe((t) => (expenseTag = t));
      expect(expenseTag).toEqual(tag({ id: 'e1', name: 'Expense', type: 'expense' }));
    });

    it('returns a fallback tag when not found', () => {
      let fallback: Tag | undefined;
      service.getTagFromId('missing', 'income').subscribe((t) => (fallback = t));
      expect(fallback).toEqual({ id: '', name: '', type: 'income' });
    });
  });

  describe('synchronousGetTagFromId', () => {
    it('returns the matching tag synchronously', () => {
      service.separateTagsByType([tag({ id: 'i1', name: 'Income', type: 'income' })]);
      expect(service.synchronousGetTagFromId('i1', 'income')).toEqual(
        tag({ id: 'i1', name: 'Income', type: 'income' }),
      );
    });

    it('returns a fallback tag synchronously', () => {
      expect(service.synchronousGetTagFromId('missing', 'expense')).toEqual({
        id: '',
        name: '',
        type: 'expense',
      });
    });
  });

  describe('separateTagsByType', () => {
    it('filters tags into income and expense streams', () => {
      service.separateTagsByType([
        tag({ id: 'i1', type: 'income' }),
        tag({ id: 'e1', type: 'expense' }),
        tag({ id: 'i2', type: 'income' }),
      ]);

      expect(latest(service.incomeTags$)).toEqual([
        tag({ id: 'i1', type: 'income' }),
        tag({ id: 'i2', type: 'income' }),
      ]);
      expect(latest(service.expenseTags$)).toEqual([
        tag({ id: 'e1', type: 'expense' }),
      ]);
    });
  });

  describe('getTags', () => {
    it('returns an empty observable when signed out', () => {
      let received: Tag[] | undefined;
      service.getTags().subscribe((t) => (received = t));
      expect(received).toEqual([]);
    });

    it('returns tags from the collection when signed in', () => {
      const tags = [tag({ id: 'i1' })];
      (fb._collectionData as { next: (v: unknown) => void }).next(tags);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let received: Tag[] | undefined;
      service.getTags().subscribe((t) => (received = t));
      expect(received).toEqual(tags);
    });
  });

  describe('addTag', () => {
    it('adds a tag document when signed in', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let emitted: string | undefined;
      service.addTag('New', 'income').subscribe((id) => (emitted = id));
      await Promise.resolve();

      expect(firestoreMocks.collection).toHaveBeenCalledWith(
        {},
        'tags/u1/userTags',
      );
      expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
        { collection: true },
        { name: 'New', type: 'income' },
      );
      expect(emitted).toBe('new-tag');
    });

    it('returns an empty id when signed out', () => {
      let emitted: string | undefined;
      service.addTag('New', 'income').subscribe((id) => (emitted = id));
      expect(emitted).toBe('');
    });

    it('propagates add errors', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.addDoc.mockRejectedValueOnce(new Error('add failed'));

      const errors: unknown[] = [];
      service.addTag('New', 'income').subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });
  });

  describe('updateTag', () => {
    it('updates a tag document when signed in', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let completed = false;
      service.updateTag('t1', { name: 'Renamed' }).subscribe({
        complete: () => (completed = true),
      });
      await Promise.resolve();

      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { name: 'Renamed' },
      );
      expect(completed).toBe(true);
    });

    it('returns an empty observable when signed out', () => {
      let completed = false;
      service.updateTag('t1', { name: 'X' }).subscribe({
        complete: () => (completed = true),
      });
      expect(completed).toBe(true);
    });

    it('propagates update errors', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.updateDoc.mockRejectedValueOnce(new Error('update failed'));

      const errors: unknown[] = [];
      service.updateTag('t1', { name: 'X' }).subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });
  });

  describe('deleteTag', () => {
    it('deletes a tag document when signed in', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let completed = false;
      service.deleteTag('t1').subscribe({ complete: () => (completed = true) });
      await Promise.resolve();

      expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith({ ref: 'doc' });
      expect(completed).toBe(true);
    });

    it('propagates delete errors', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.deleteDoc.mockRejectedValueOnce(new Error('delete failed'));

      const errors: unknown[] = [];
      service.deleteTag('t1').subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });

    it('returns an empty observable when signed out', () => {
      let completed = false;
      service.deleteTag('t1').subscribe({ complete: () => (completed = true) });
      expect(completed).toBe(true);
    });
  });

  describe('addTagToTransaction', () => {
    it('adds the tag id using arrayUnion', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let completed = false;
      service.addTagToTransaction('tr1', 'tg1', 'expense').subscribe({
        complete: () => (completed = true),
      });
      await Promise.resolve();

      expect(firestoreMocks.arrayUnion).toHaveBeenCalledWith('tg1');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { tagIds: ['union', 'tg1'] },
      );
      expect(completed).toBe(true);
    });

    it('returns an empty observable when signed out', () => {
      let completed = false;
      service.addTagToTransaction('tr1', 'tg1', 'expense').subscribe({
        complete: () => (completed = true),
      });
      expect(completed).toBe(true);
    });

    it('propagates errors adding a tag to a transaction', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.updateDoc.mockRejectedValueOnce(new Error('update failed'));

      const errors: unknown[] = [];
      service.addTagToTransaction('tr1', 'tg1', 'expense').subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });
  });

  describe('removeTagFromTransaction', () => {
    it('removes the tag id using arrayRemove', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });

      let completed = false;
      service.removeTagFromTransaction('tr1', 'tg1', 'income').subscribe({
        complete: () => (completed = true),
      });
      await Promise.resolve();

      expect(firestoreMocks.arrayRemove).toHaveBeenCalledWith('tg1');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        { ref: 'doc' },
        { tagIds: ['remove', 'tg1'] },
      );
      expect(completed).toBe(true);
    });

    it('returns an empty observable when signed out', () => {
      let completed = false;
      service.removeTagFromTransaction('tr1', 'tg1', 'income').subscribe({
        complete: () => (completed = true),
      });
      expect(completed).toBe(true);
    });

    it('propagates errors removing a tag from a transaction', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.updateDoc.mockRejectedValueOnce(new Error('update failed'));

      const errors: unknown[] = [];
      service.removeTagFromTransaction('tr1', 'tg1', 'income').subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });
  });

  describe('getTagsForTransaction', () => {
    it('returns tags referenced by the transaction when it exists', async () => {
      const tags = [tag({ id: 'x', name: 'X' }), tag({ id: 'y', name: 'Y' })];
      (fb._collectionData as { next: (v: unknown) => void }).next(tags);
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'tr1',
        data: () => ({ tagIds: ['x'] }),
      });

      let received: Tag[] | undefined;
      service.getTagsForTransaction('tr1', 'income').subscribe((t) => (received = t));
      await Promise.resolve();
      await Promise.resolve();

      expect(received).toEqual([tag({ id: 'x', name: 'X' })]);
    });

    it('returns an empty list when the transaction is missing', async () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

      let received: Tag[] | undefined;
      service.getTagsForTransaction('tr1', 'income').subscribe((t) => (received = t));
      await Promise.resolve();

      expect(received).toEqual([]);
    });

    it('returns an empty observable when signed out', () => {
      let received: Tag[] | undefined;
      service.getTagsForTransaction('tr1', 'income').subscribe((t) => (received = t));
      expect(received).toEqual([]);
    });

    it('propagates document read errors', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.getDoc.mockRejectedValueOnce(new Error('read failed'));

      const errors: unknown[] = [];
      service.getTagsForTransaction('tr1', 'income').subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });

    it('propagates errors from loading tags for a transaction', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'tr1',
        data: () => ({ tagIds: ['x'] }),
      });
      (fb.collectionData$ as ReturnType<typeof vi.fn>).mockImplementation(() =>
        throwError(() => new Error('tag load failed')),
      );

      const errors: unknown[] = [];
      service.getTagsForTransaction('tr1', 'income').subscribe({
        next: () => undefined,
        error: (e) => errors.push(e),
      });

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(errors).toHaveLength(1);
          resolve();
        }, 0);
      });
    });
  });

  describe('getTransactionsByTag', () => {
    it('returns transactions matching the tag', () => {
      (fb._authState as { next: (v: unknown) => void }).next({ uid: 'u1' });
      (fb._collectionData as { next: (v: unknown) => void }).next([
        { id: 'tr1', tagIds: ['x'] },
        { id: 'tr2', tagIds: ['y'] },
        { id: 'tr3' },
      ]);

      let received: unknown[] | undefined;
      service.getTransactionsByTag('x', 'income').subscribe((t) => (received = t));

      expect(received).toEqual([{ id: 'tr1', tagIds: ['x'] }]);
    });

    it('returns an empty observable when signed out', () => {
      let received: unknown[] | undefined;
      service.getTransactionsByTag('x', 'income').subscribe((t) => (received = t));
      expect(received).toEqual([]);
    });
  });
});

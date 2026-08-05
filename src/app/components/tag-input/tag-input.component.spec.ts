import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { TagInputComponent } from './tag-input.component';
import { TagService } from '../../services/tags/tag.service';
import { Tag } from '../../models/chart.interface';

const incomeTags: Tag[] = [
  { id: 'i1', name: 'Salary', type: 'income' },
  { id: 'i2', name: 'Bonus', type: 'income' },
];

const expenseTags: Tag[] = [
  { id: 'e1', name: 'Food', type: 'expense' },
  { id: 'e2', name: 'Transport', type: 'expense' },
];

describe('TagInputComponent', () => {
  let component: TagInputComponent;
  let fixture: ComponentFixture<TagInputComponent>;
  let incomeSubject: BehaviorSubject<Tag[]>;
  let expenseSubject: BehaviorSubject<Tag[]>;
  let addTagSubject: Subject<string>;
  let getTagSubject: Subject<Tag | null>;
  let tagStub: {
    incomeTags$: Observable<Tag[]>;
    expenseTags$: Observable<Tag[]>;
    getTagFromId: ReturnType<typeof vi.fn>;
    addTag: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    incomeSubject = new BehaviorSubject<Tag[]>(incomeTags);
    expenseSubject = new BehaviorSubject<Tag[]>(expenseTags);
    addTagSubject = new Subject<string>();
    getTagSubject = new Subject<Tag | null>();
    tagStub = {
      incomeTags$: incomeSubject.asObservable(),
      expenseTags$: expenseSubject.asObservable(),
      getTagFromId: vi.fn(() => getTagSubject.asObservable()),
      addTag: vi.fn(() => addTagSubject.asObservable()),
    };
    await TestBed.configureTestingModule({
      imports: [TagInputComponent],
      providers: [{ provide: TagService, useValue: tagStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(TagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes suggestions from income tags by default', () => {
    component.ngOnInit();
    expect(component.suggestions).toEqual(incomeTags);
  });

  it('initializes suggestions from expense tags', () => {
    component.type = 'expense';
    component.ngOnInit();
    expect(component.suggestions).toEqual(expenseTags);
  });

  it('loads the selected tag when a tag id is provided', () => {
    component.tagId = 'e1';
    component.ngOnInit();
    expect(tagStub.getTagFromId).toHaveBeenCalledWith('e1', 'income');
    expect(component.suggestions.some((t) => t.id === 'e1')).toBe(false);
    getTagSubject.next({ id: 'e1', name: 'Food', type: 'expense' });
    getTagSubject.complete();
    expect(component.selectedTag).toEqual({
      id: 'e1',
      name: 'Food',
      type: 'expense',
    });
  });

  it('filters suggestions by query and sorts by name length', () => {
    component.type = 'expense';
    component.ngOnInit();
    component.filterSuggestions('o');
    expect(component.suggestions.map((t) => t.name)).toEqual(['Food', 'Transport']);
  });

  it('resets suggestions when the query is empty', () => {
    component.type = 'expense';
    component.ngOnInit();
    component.filterSuggestions('');
    expect(component.suggestions).toEqual(expenseTags);
  });

  it('removes the selected tag from suggestions', () => {
    component.type = 'expense';
    component.ngOnInit();
    component.selectedTag = { id: 'e1', name: 'Food', type: 'expense' };
    component.filterSuggestions('x');
    expect(component.suggestions.some((t) => t.id === 'e1')).toBe(false);
  });

  it('addTag emits, resets the form and loads the new tag on success', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.addTag('Groceries');
    addTagSubject.next('new-id');
    addTagSubject.complete();
    getTagSubject.next({ id: 'new-id', name: 'Groceries', type: 'income' });
    getTagSubject.complete();
    expect(tagStub.addTag).toHaveBeenCalledWith('Groceries', 'income');
    expect(emitted).toEqual(['new-id']);
    expect(component.tagForm.value).toBe('');
    expect(component.isFocused).toBe(false);
    expect(component.highlightedIndex).toBe(-1);
    expect(component.selectedTag).toEqual({
      id: 'new-id',
      name: 'Groceries',
      type: 'income',
    });
    expect(component.suggestions.some((t) => t.id === 'new-id')).toBe(false);
  });

  it('logs an error when adding a tag fails', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.addTag('Groceries');
    addTagSubject.error(new Error('boom'));
    expect(consoleError).toHaveBeenCalledWith(
      'Error adding tag:',
      expect.any(Error),
    );
    consoleError.mockRestore();
  });

  it('addExistingTag emits the tag id and blurs the input', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.type = 'expense';
    component.ngOnInit();
    component.addExistingTag({ id: 'e1', name: 'Food', type: 'expense' });
    expect(emitted).toEqual(['e1']);
    expect(component.selectedTag).toEqual({
      id: 'e1',
      name: 'Food',
      type: 'expense',
    });
    expect(component.suggestions.some((t) => t.id === 'e1')).toBe(false);
  });

  it('onFocus sets focus state', () => {
    component.onFocus();
    expect(component.isFocused).toBe(true);
    expect(component.highlightedIndex).toBe(-1);
  });

  it('onBlur clears focus after a delay', () => {
    vi.useFakeTimers();
    component.isFocused = true;
    component.onBlur();
    expect(component.isFocused).toBe(true);
    vi.advanceTimersByTime(201);
    expect(component.isFocused).toBe(false);
    vi.useRealTimers();
  });

  it('onKeydown Escape closes the list', () => {
    component.isFocused = true;
    component.onKeydown({ key: 'Escape', preventDefault: vi.fn() } as any);
    expect(component.isFocused).toBe(false);
  });

  it('onKeydown ArrowDown moves the highlight and wraps', () => {
    component.suggestions = incomeTags;
    component.highlightedIndex = 1;
    component.onKeydown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
    expect(component.highlightedIndex).toBe(0);
  });

  it('onKeydown ArrowUp moves the highlight', () => {
    component.suggestions = incomeTags;
    component.highlightedIndex = 0;
    component.onKeydown({ key: 'ArrowUp', preventDefault: vi.fn() } as any);
    expect(component.highlightedIndex).toBe(1);
  });

  it('onKeydown arrows do nothing without suggestions', () => {
    component.suggestions = [];
    component.onKeydown({ key: 'ArrowDown', preventDefault: vi.fn() } as any);
    expect(component.highlightedIndex).toBe(-1);
  });

  it('onKeydown Enter selects the highlighted tag', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.suggestions = incomeTags;
    component.highlightedIndex = 0;
    component.onKeydown({ key: 'Enter', preventDefault: vi.fn() } as any);
    expect(emitted).toEqual(['i1']);
  });

  it('onKeydown Enter delegates to onEnterKey', () => {
    const onEnterKey = vi.spyOn(component, 'onEnterKey').mockImplementation(() => {});
    component.suggestions = incomeTags;
    component.highlightedIndex = -1;
    component.onKeydown({ key: 'Enter', preventDefault: vi.fn() } as any);
    expect(onEnterKey).toHaveBeenCalled();
  });

  it('onKeydown Enter ignores a missing highlighted tag', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.suggestions = [];
    component.highlightedIndex = 0;
    component.onKeydown({ key: 'Enter', preventDefault: vi.fn() } as any);
    expect(emitted).toEqual([]);
    expect(component.selectedTag).toBeNull();
  });

  it('onKeydown ignores unrelated keys', () => {
    const onEnterKey = vi.spyOn(component, 'onEnterKey');
    component.onKeydown({ key: 'a', preventDefault: vi.fn() } as any);
    expect(onEnterKey).not.toHaveBeenCalled();
  });

  it('removeExistingTag returns early without a selected tag', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.removeExistingTag();
    expect(emitted).toEqual([]);
  });

  it('removeExistingTag clears the selection and emits null', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.selectedTag = incomeTags[0];
    component.type = 'expense';
    component.ngOnInit();
    component.removeExistingTag();
    expect(emitted).toEqual([null]);
    expect(component.selectedTag).toBeNull();
    expect(component.suggestions).toEqual(expenseTags);
  });

  it('removeExistingTag restores income suggestions when the type is income', () => {
    component.selectedTag = incomeTags[0];
    component.type = 'income';
    component.ngOnInit();
    component.removeExistingTag();
    expect(component.selectedTag).toBeNull();
    expect(component.suggestions).toEqual(incomeTags);
  });

  it('removeTagFromSuggestions filters the tag out', () => {
    component.suggestions = [...incomeTags];
    component.removeTagFromSuggestions('i1');
    expect(component.suggestions.map((t) => t.id)).toEqual(['i2']);
  });

  it('showAddTagOption is true when no exact match exists', () => {
    component.type = 'income';
    component.ngOnInit();
    component.tagForm.setValue('Groceries');
    expect(component.showAddTagOption()).toBe(true);
  });

  it('showAddTagOption is false when an exact match exists', () => {
    component.type = 'income';
    component.ngOnInit();
    component.tagForm.setValue('Salary');
    expect(component.showAddTagOption()).toBe(false);
  });

  it('onEnterKey returns early when the form is empty', () => {
    component.tagForm.setValue('');
    const onEnterKey = vi.spyOn(component, 'onEnterKey');
    const result = component.onEnterKey(new Event('keydown'));
    expect(result).toBeUndefined();
    expect(onEnterKey).toHaveBeenCalled();
  });

  it('onEnterKey adds an exact matching tag', () => {
    const emitted: Array<string | null> = [];
    component.tagAdded.subscribe((id) => emitted.push(id));
    component.type = 'income';
    component.ngOnInit();
    component.tagForm.setValue('Salary');
    component.onEnterKey(new Event('keydown'));
    expect(emitted).toEqual(['i1']);
  });

  it('onEnterKey creates a new tag when no exact match exists', () => {
    component.type = 'income';
    component.ngOnInit();
    component.tagForm.setValue('Groceries');
    component.onEnterKey(new Event('keydown'));
    expect(tagStub.addTag).toHaveBeenCalledWith('Groceries', 'income');
  });

  it('isOptionHighlighted compares case-insensitively', () => {
    component.type = 'income';
    component.ngOnInit();
    component.tagForm.setValue('salary');
    expect(component.isOptionHighlighted('SALARY')).toBe(true);
    expect(component.isOptionHighlighted('bonus')).toBe(false);
  });

  it('ngOnDestroy completes the destroy subject', () => {
    const next = vi.spyOn(component.destroy$, 'next');
    component.ngOnDestroy();
    expect(next).toHaveBeenCalled();
  });
});

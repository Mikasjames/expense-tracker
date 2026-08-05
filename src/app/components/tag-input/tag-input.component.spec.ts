import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tag } from '../../models/chart.interface';

import { TagInputComponent } from './tag-input.component';

describe('TagInputComponent', () => {
  let component: TagInputComponent;
  let fixture: ComponentFixture<TagInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('removes the selected tag when the remove button is clicked', () => {
    const selectedTag: Tag = {
      id: 'tag-1',
      name: 'Groceries',
      type: 'expense',
    };
    component.selectedTag = selectedTag;
    const emittedTags: Array<string | null> = [];
    component.tagAdded.subscribe((tagId) => emittedTags.push(tagId));
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector(
      'button[aria-label="Remove tag"]',
    ) as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(emittedTags).toEqual([null]);
    expect(component.selectedTag).toBeNull();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Remove tag"]'),
    ).toBeNull();
  });

  it('closes suggestions after selecting an existing tag', () => {
    const selectedTag: Tag = {
      id: 'tag-1',
      name: 'Groceries',
      type: 'expense',
    };
    component.isFocused = true;

    component.addExistingTag(selectedTag);
    fixture.detectChanges();

    expect(component.isFocused).toBe(false);
    expect(fixture.nativeElement.querySelector('ul')).toBeNull();
  });
});

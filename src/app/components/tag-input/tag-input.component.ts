import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { TagService } from '../../services/tags/tag.service';
import { Tag } from '../../models/chart.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.sass',
})
export class TagInputComponent implements OnInit, OnDestroy {
  @Input() type: 'income' | 'expense' = 'income';
  @Input() tagId: string | null = null;
  @Output() tagAdded = new EventEmitter<string | null>();
  incomeTags: Tag[] = [];
  expenseTags: Tag[] = [];
  tagForm: FormControl = new FormControl('');
  selectedTag: Tag | null = null;
  suggestions: Tag[] = [];
  searchDelay = 0;
  isFocused = false;
  destroy$ = new Subject<void>();

  constructor(private tagService: TagService) {
    this.tagService.incomeTags$.subscribe((tags) => {
      this.incomeTags = tags;
    });
    this.tagService.expenseTags$.subscribe((tags) => {
      this.expenseTags = tags;
    });
    this.tagForm.valueChanges
      .pipe(debounceTime(this.searchDelay))
      .subscribe((value) => {
        this.filterSuggestions(value);
      });
  }

  ngOnInit() {
    this.suggestions =
      this.type === 'income' ? this.incomeTags : this.expenseTags;
    if (this.tagId === null) return;
    this.removeTagFromSuggestions(this.tagId);
    this.tagService
      .getTagFromId(this.tagId, this.type)
      .pipe(
        takeUntil(this.destroy$), // Assuming you've set up a destroy$ Subject
      )
      .subscribe((tag) => {
        this.selectedTag = tag;
      });
  }

  filterSuggestions(query: string) {
    if (!query) {
      this.suggestions =
        this.type === 'income' ? this.incomeTags : this.expenseTags;
    } else {
      const lowerCaseQuery = query.toLowerCase();
      this.suggestions = (
        this.type === 'income' ? this.incomeTags : this.expenseTags
      )
        .filter((tag) => tag.name.toLowerCase().includes(lowerCaseQuery))
        .sort((a, b) => a.name.length - b.name.length); // Sort by length of tag name
    }
    if (this.selectedTag) {
      this.removeTagFromSuggestions(this.selectedTag.id);
    }
  }

  addTag(tag: string) {
    this.tagService.addTag(tag, this.type).subscribe(
      (tagId) => {
        this.tagAdded.emit(tagId);
        this.tagForm.setValue('');
        this.tagService.getTagFromId(tagId, this.type).subscribe((tag) => {
          this.selectedTag = tag;
        });
        this.removeTagFromSuggestions(tagId);
      },
      (error) => {
        console.error('Error adding tag:', error);
      },
    );
  }

  addExistingTag(tag: Tag) {
    const textarea = document.getElementById('tagIds') as HTMLTextAreaElement;
    textarea.blur();
    this.tagAdded.emit(tag.id);
    this.tagForm.setValue('');
    this.selectedTag = tag;
    this.removeTagFromSuggestions(tag.id);
  }

  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    setTimeout(() => {
      this.isFocused = false;
    }, 200);
  }

  removeExistingTag() {
    if (!this.selectedTag) return;
    this.tagAdded.emit(null);
    this.suggestions =
      this.type === 'income' ? this.incomeTags : this.expenseTags;
    this.selectedTag = null;
  }

  removeTagFromSuggestions(tagId: string) {
    this.suggestions = this.suggestions.filter((tag) => tag.id !== tagId);
  }

  showAddTagOption() {
    return !this.suggestions.some(
      (tag) => tag.name.toLowerCase() === this.tagForm.value.toLowerCase(),
    );
  }

  onEnterKey(event: Event) {
    if (!this.tagForm.value) return;
    event.preventDefault();
    const exactMatch = this.suggestions.find(
      (tag) => tag.name.toLowerCase() === this.tagForm.value.toLowerCase(),
    );

    if (exactMatch) {
      this.addExistingTag(exactMatch);
      return;
    }
    this.addTag(this.tagForm.value);

    const textarea = document.getElementById('tagIds') as HTMLTextAreaElement;
    textarea.blur(); // Remove focus from the textarea
  }

  isOptionHighlighted(tagName: string) {
    return tagName.toLowerCase() === this.tagForm.value.toLowerCase();
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}

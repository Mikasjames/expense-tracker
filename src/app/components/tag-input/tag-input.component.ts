import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TagService } from '../../services/tags/tag.service';
import { Tag } from '../../models/chart.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.sass',
})
export class TagInputComponent implements OnChanges {
  @Input() type: 'income' | 'expense' = 'income';
  @Output() tagAdded = new EventEmitter<string>();
  incomeTags: Tag[] = [];
  expenseTags: Tag[] = [];
  tagForm: FormControl = new FormControl('');
  suggestions: Tag[] = [];

  constructor(private tagService: TagService) {
    this.tagService.incomeTags$.subscribe((tags) => {
      this.incomeTags = tags;
    });
    this.tagService.expenseTags$.subscribe((tags) => {
      this.expenseTags = tags;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['type']) {
      this.type = changes['type'].currentValue;
      this.suggestions =
        this.type === 'income' ? this.incomeTags : this.expenseTags;
    }
  }

  addTag(tag: string) {
    this.tagService.addTag(tag, this.type).subscribe(
      (tagId) => {
        console.log('Tag added successfully');
        this.tagAdded.emit(tagId);
      },
      (error) => {
        console.error('Error adding tag:', error);
      },
    );
  }

  addExistingTag(tag: Tag) {
    this.tagAdded.emit(tag.name);
  }

  removeTag(tag: Tag) {}
}

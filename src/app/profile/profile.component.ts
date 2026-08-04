import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Auth, updateProfile } from 'firebase/auth';
import { Firestore, doc, updateDoc } from 'firebase/firestore';
import { AuthService } from '../services/auth/auth.service';
import { UserInterface } from '../models/user.interface';
import {
  AUTH,
  FIRESTORE,
  FirebaseService,
} from '../services/firebase/firebase.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.component.sass',
})
export class ProfileComponent implements OnInit {
  user: UserInterface | null = null;
  editingUsername = false;
  usernameInput = '';
  saving = false;
  saved = false;
  private uid: string | null = null;

  constructor(
    private authService: AuthService,
    @Inject(AUTH) private auth: Auth,
    @Inject(FIRESTORE) private firestore: Firestore,
    private fb: FirebaseService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user ?? null;
      this.usernameInput = user?.username || '';
    });
    this.fb.user$().subscribe((u) => {
      this.uid = u?.uid || null;
    });
  }

  get initials(): string {
    if (!this.user?.username) return '?';
    return this.user.username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  startEdit() {
    this.editingUsername = true;
    this.saved = false;
  }

  cancelEdit() {
    this.editingUsername = false;
    this.usernameInput = this.user?.username || '';
  }

  saveUsername() {
    if (!this.uid || !this.usernameInput.trim()) return;
    const username = this.usernameInput.trim();
    this.saving = true;
    updateDoc(doc(this.firestore, `users/${this.uid}`), { username })
      .then(() => {
        const currentUser = this.auth.currentUser;
        if (currentUser) {
          return updateProfile(currentUser, { displayName: username });
        }
        return Promise.resolve();
      })
      .then(() => {
        this.saving = false;
        this.editingUsername = false;
        this.saved = true;
        if (this.user) {
          this.user = { ...this.user, username };
        }
        setTimeout(() => (this.saved = false), 2000);
      })
      .catch(() => {
        this.saving = false;
      });
  }
}

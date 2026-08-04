import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, user, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../services/auth/auth.service';
import { UserInterface } from '../models/user.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
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
    private auth: Auth,
    private firestore: Firestore,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user ?? null;
      this.usernameInput = user?.username || '';
    });
    user(this.auth).subscribe((u) => {
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

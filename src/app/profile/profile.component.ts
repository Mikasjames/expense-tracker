import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth/auth.service';
import { UserInterface } from '../models/user.interface';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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
    private fireAuth: AngularFireAuth,
    private firestore: AngularFirestore,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user ?? null;
      this.usernameInput = user?.username || '';
    });
    this.fireAuth.currentUser.then((u) => {
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
    this.saving = true;
    this.firestore
      .doc(`users/${this.uid}`)
      .update({ username: this.usernameInput.trim() })
      .then(() => {
        this.saving = false;
        this.editingUsername = false;
        this.saved = true;
        if (this.user) {
          this.user = { ...this.user, username: this.usernameInput.trim() };
        }
        setTimeout(() => (this.saved = false), 2000);
      })
      .catch(() => {
        this.saving = false;
      });
  }
}

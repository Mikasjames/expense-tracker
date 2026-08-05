import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile.component';
import { AUTH, FIRESTORE, FirebaseService } from '../services/firebase/firebase.service';
import { AuthService } from '../services/auth/auth.service';
import { createAuthServiceStub, createFirebaseServiceStub } from '../testing/service-stubs';

async function flushAsync() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

const firebaseMocks = vi.hoisted(() => ({
  updateProfile: vi.fn(async () => undefined),
  updateDoc: vi.fn(async () => undefined),
  doc: vi.fn(() => ({ path: 'users/u1' })),
}));

vi.mock('firebase/auth', () => ({
  updateProfile: firebaseMocks.updateProfile,
}));

vi.mock('firebase/firestore', () => ({
  doc: firebaseMocks.doc,
  updateDoc: firebaseMocks.updateDoc,
}));

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authStub: ReturnType<typeof createAuthServiceStub>;
  let fbStub: ReturnType<typeof createFirebaseServiceStub>;
  let authToken: { currentUser: any };

  beforeEach(async () => {
    vi.clearAllMocks();
    authStub = createAuthServiceStub();
    fbStub = createFirebaseServiceStub();
    authToken = { currentUser: null };
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: AUTH, useValue: authToken },
        { provide: FIRESTORE, useValue: {} },
        { provide: FirebaseService, useValue: fbStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the user and username from the auth stream', () => {
    authStub._currentUser.next({ email: 'a@b.com', username: 'Jane' });
    expect(component.user?.username).toBe('Jane');
    expect(component.usernameInput).toBe('Jane');
  });

  it('clears the user when signed out', () => {
    authStub._currentUser.next(null);
    expect(component.user).toBeNull();
    expect(component.usernameInput).toBe('');
  });

  it('stores the uid from the firebase user stream', () => {
    fbStub._user.next({ uid: 'u1' });
    expect(component['uid']).toBe('u1');
  });

  it('initials returns a question mark without a username', () => {
    component.user = null;
    expect(component.initials).toBe('?');
    component.user = { email: 'a@b.com', username: '' };
    expect(component.initials).toBe('?');
  });

  it('initials builds from the username', () => {
    component.user = { email: 'a@b.com', username: 'John Doe Smith' };
    expect(component.initials).toBe('JD');
    component.user = { email: 'a@b.com', username: 'john' };
    expect(component.initials).toBe('J');
  });

  it('startEdit enters edit mode', () => {
    component.startEdit();
    expect(component.editingUsername).toBe(true);
    expect(component.saved).toBe(false);
  });

  it('cancelEdit leaves edit mode and restores the username', () => {
    component.user = { email: 'a@b.com', username: 'Jane' };
    component.usernameInput = 'Other';
    component.cancelEdit();
    expect(component.editingUsername).toBe(false);
    expect(component.usernameInput).toBe('Jane');
  });

  it('cancelEdit clears the input without a user', () => {
    component.user = null;
    component.usernameInput = 'Other';
    component.cancelEdit();
    expect(component.editingUsername).toBe(false);
    expect(component.usernameInput).toBe('');
  });

  it('saveUsername returns early without a uid', () => {
    component.usernameInput = 'Jane';
    component.saveUsername();
    expect(firebaseMocks.updateDoc).not.toHaveBeenCalled();
  });

  it('saveUsername returns early with a blank username', () => {
    fbStub._user.next({ uid: 'u1' });
    component.usernameInput = '   ';
    component.saveUsername();
    expect(firebaseMocks.updateDoc).not.toHaveBeenCalled();
  });

  it('saveUsername updates the document and auth profile', async () => {
    fbStub._user.next({ uid: 'u1' });
    component.user = { email: 'a@b.com', username: 'Old' };
    component.usernameInput = '  NewName  ';
    authToken.currentUser = { displayName: 'Old' };
    component.saveUsername();
    expect(firebaseMocks.doc).toHaveBeenCalledWith({}, 'users/u1');
    expect(firebaseMocks.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { username: 'NewName' },
    );
    await flushAsync();
    expect(firebaseMocks.updateProfile).toHaveBeenCalledWith(
      authToken.currentUser,
      { displayName: 'NewName' },
    );
    expect(component.saving).toBe(false);
    expect(component.editingUsername).toBe(false);
    expect(component.saved).toBe(true);
    expect(component.user?.username).toBe('NewName');
  });

  it('saveUsername skips the profile update without a current user', async () => {
    fbStub._user.next({ uid: 'u1' });
    component.user = { email: 'a@b.com', username: 'Old' };
    component.usernameInput = 'NewName';
    component.saveUsername();
    await flushAsync();
    expect(firebaseMocks.updateProfile).not.toHaveBeenCalled();
    expect(component.saved).toBe(true);
  });

  it('saveUsername resets saved flag after a delay', async () => {
    vi.useFakeTimers();
    fbStub._user.next({ uid: 'u1' });
    component.user = { email: 'a@b.com', username: 'Old' };
    component.usernameInput = 'NewName';
    component.saveUsername();
    await flushAsync();
    expect(component.saved).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(component.saved).toBe(false);
    vi.useRealTimers();
  });

  it('saveUsername clears the saving flag on error', async () => {
    firebaseMocks.updateDoc.mockRejectedValueOnce(new Error('boom'));
    fbStub._user.next({ uid: 'u1' });
    component.user = { email: 'a@b.com', username: 'Old' };
    component.usernameInput = 'NewName';
    component.saveUsername();
    await flushAsync();
    expect(component.saving).toBe(false);
    expect(component.saved).toBe(false);
  });

  it('saveUsername succeeds without a local user', async () => {
    fbStub._user.next({ uid: 'u1' });
    component.user = null;
    component.usernameInput = 'NewName';
    component.saveUsername();
    await flushAsync();
    expect(component.saved).toBe(true);
    expect(component.user).toBeNull();
  });
});

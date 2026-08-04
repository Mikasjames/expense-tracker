import { initializeApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { provideRouter } from '@angular/router';
import { provideEcharts } from 'ngx-echarts';
import { AUTH, FIRESTORE } from './app/services/firebase/firebase.service';
import { environment } from './environments/environment';
import { LoginComponent } from './app/auth/login/login.component';

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

const app = initializeApp(environment.firebaseConfig);
const auth = initializeAuth(app, { persistence: inMemoryPersistence });
const firestore = getFirestore(app);

const providers = [
  { provide: AUTH, useValue: auth },
  { provide: FIRESTORE, useValue: firestore },
  provideEcharts(),
  provideRouter([{ path: 'login', component: LoginComponent }]),
];

export default providers;
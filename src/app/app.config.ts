import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import {
  AUTH,
  FIRESTORE,
  FirebaseService,
} from './services/firebase/firebase.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    {
      provide: AUTH,
      useFactory: (fb: FirebaseService) => fb.auth,
      deps: [FirebaseService],
    },
    {
      provide: FIRESTORE,
      useFactory: (fb: FirebaseService) => fb.fs,
      deps: [FirebaseService],
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

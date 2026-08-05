import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideClientHydration,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowRight,
  lucideArrowUp,
  lucideBarChart,
  lucideBell,
  lucideCalendarDays,
  lucideChartLine,
  lucideCheck,
  lucideCheckCircle,
  lucideChevronLeft,
  lucideChevronRight,
  lucideFileText,
  lucideHouse,
  lucideInfo,
  lucideLogOut,
  lucideMenu,
  lucideMinus,
  lucidePalette,
  lucidePencil,
  lucidePlus,
  lucideSettings,
  lucideShieldCheck,
  lucideTagPlus,
  lucideTrash2,
  lucideUser,
  lucideX,
  lucideXCircle,
} from '@ng-icons/lucide';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';
import { routes } from './app.routes';
import {
  AUTH,
  FIRESTORE,
  FirebaseService,
} from './services/firebase/firebase.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withNoIncrementalHydration()),
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
    provideSpartanHlm(),
    provideIcons({
      lucideArrowDown,
      lucideArrowRight,
      lucideArrowUp,
      lucideBarChart,
      lucideBell,
      lucideCalendarDays,
      lucideChartLine,
      lucideCheck,
      lucideCheckCircle,
      lucideChevronLeft,
      lucideChevronRight,
      lucideFileText,
      lucideHouse,
      lucideInfo,
      lucideLogOut,
      lucideMenu,
      lucideMinus,
      lucidePalette,
      lucidePencil,
      lucidePlus,
      lucideSettings,
      lucideShieldCheck,
      lucideTagPlus,
      lucideTrash2,
      lucideUser,
      lucideX,
      lucideXCircle,
    }),
  ],
};

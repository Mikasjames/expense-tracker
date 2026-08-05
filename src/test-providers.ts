import { provideRouter } from '@angular/router';
import { provideEcharts } from 'ngx-echarts';

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

const providers = [provideEcharts(), provideRouter([])];

export default providers;

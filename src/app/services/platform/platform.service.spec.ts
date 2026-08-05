import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PlatformService);
    expect(service).toBeTruthy();
  });

  describe('on the browser platform', () => {
    let service: PlatformService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(PlatformService);
    });

    it('reports isBrowser true', () => {
      expect(service.isBrowser()).toBe(true);
    });

    it('reports isServer false', () => {
      expect(service.isServer()).toBe(false);
    });
  });

  describe('on the server platform', () => {
    let service: PlatformService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(PlatformService);
    });

    it('reports isBrowser false', () => {
      expect(service.isBrowser()).toBe(false);
    });

    it('reports isServer true', () => {
      expect(service.isServer()).toBe(true);
    });
  });
});

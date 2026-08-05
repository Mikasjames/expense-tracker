import { describe, expect, it } from 'vitest';

import { config } from './app.config.server';
import { appConfig } from './app.config';

describe('app.config.server', () => {
  it('merges the app config with the server config', () => {
    expect(config.providers.length).toBeGreaterThan(appConfig.providers.length);
  });

  it('keeps the app config providers', () => {
    expect(config.providers).toEqual(expect.arrayContaining(appConfig.providers));
  });
});

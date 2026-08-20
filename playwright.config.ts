import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:6006',
    colorScheme: 'light'
  },
  webServer: {
    command: 'pnpm storybook --ci',
    url: 'http://localhost:6006',
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium-desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
    { name: 'chromium-tablet', use: { browserName: 'chromium', viewport: { width: 768, height: 900 } } },
    { name: 'chromium-mobile', use: { browserName: 'chromium', viewport: { width: 360, height: 800 } } },
    { name: 'firefox-desktop', use: { browserName: 'firefox', viewport: { width: 1280, height: 900 } } },
    { name: 'firefox-tablet', use: { browserName: 'firefox', viewport: { width: 768, height: 900 } } },
    { name: 'firefox-mobile', use: { browserName: 'firefox', viewport: { width: 360, height: 800 } } },
    { name: 'webkit-desktop', use: { browserName: 'webkit', viewport: { width: 1280, height: 900 } } },
    { name: 'webkit-tablet', use: { browserName: 'webkit', viewport: { width: 768, height: 900 } } },
    { name: 'webkit-mobile', use: { browserName: 'webkit', viewport: { width: 360, height: 800 } } }
  ]
});

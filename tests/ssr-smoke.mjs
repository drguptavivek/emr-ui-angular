import '@angular/compiler';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { chromium } from '@playwright/test';
import { EmrSsrHostComponent } from './ssr-host.mjs';

const html = await renderApplication(
  context => bootstrapApplication(EmrSsrHostComponent, { providers: [provideClientHydration()] }, context),
  { document: '<!doctype html><html><body><emr-ssr-host></emr-ssr-host></body></html>', url: 'http://localhost/', allowedHosts: ['localhost'] }
);

for (const expected of ['role="dialog"', 'SSR document', 'Synthetic document page', 'Patient encounters', 'SSR assessment', 'Create an EMR field', 'SSR reusable template', 'SSR PAC checklist', 'ngh="']) {
  if (!html.includes(expected)) throw new Error(`SSR output is missing ${expected}`);
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'emr-hydration-'));
const browserBundle = join(temporaryDirectory, 'hydration-client.js');
try {
  await build({ entryPoints: [new URL('./hydration-client.mjs', import.meta.url).pathname], bundle: true, format: 'iife', platform: 'browser', outfile: browserBundle });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', error => consoleErrors.push(String(error)));
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ path: browserBundle });
    await page.waitForFunction(() => globalThis.__emrHydrated === true || Boolean(globalThis.__emrHydrationError), null, { timeout: 10_000 }).catch(async error => {
      const flags = await page.evaluate(() => ({ hydrated: globalThis.__emrHydrated, error: globalThis.__emrHydrationError }));
      throw new Error(`Client hydration did not settle: ${String(error)}; flags=${JSON.stringify(flags)}; console=${consoleErrors.join('\n')}`);
    });
    const hydrationError = await page.evaluate(() => globalThis.__emrHydrationError ?? null);
    if (hydrationError) throw new Error(`Client hydration failed: ${hydrationError}`);
    if (consoleErrors.some(message => /NG05\d\d|hydration mismatch/i.test(message))) {
      throw new Error(`Client hydration reported an Angular mismatch: ${consoleErrors.join('\n')}`);
    }
    const timelineButton = page.locator('.emr-timeline__button').first();
    await timelineButton.focus();
    if (!(await timelineButton.evaluate(element => element === document.activeElement))) throw new Error('Hydrated timeline is not focusable');
  } finally {
    await browser.close();
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

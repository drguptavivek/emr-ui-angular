import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

type StoryIndex = { entries?: Record<string, { type?: string; title?: string; name?: string }> };

const representativeStories = [
  'foundations-colors--light-semantic-palette',
  'foundations-primitives--controls',
  'foundations-primitives--search-multi-select',
  'foundations-primitives--feedback-states',
  'emr-patient-and-navigation--patient-card',
  'emr-patient-and-navigation--patient-list',
  'emr-patient-and-navigation--application-shell-dark',
  'emr-patient-and-navigation--right-flyout',
  'emr-clinical-assessment--ophthalmology-odos',
  'emr-clinical-assessment-ophthalmology--spectacle-prescription',
  'emr-clinical-assessment--neurology-four-limb',
  'emr-clinical-assessment--encounter-timeline-horizontal',
  'emr-clinical-forms-history--history',
  'emr-clinical-forms-system-examinations--cardiovascular',
  'emr-history-family-history--populated',
  'emr-safety-staged-checklist--incomplete',
  'emr-safety-pac-checklist--default',
  'emr-clinical-assessment-ophthalmology--perimetry-result',
  'emr-documents--patient-documents',
  'emr-documents--integrated-click-to-open-journey',
  'emr-documents--pdf-raster-carousel',
  'emr-orders-and-favourites--laboratory-hierarchy',
  'emr-orders-and-favourites--radiology-hierarchy-with-preview',
  'emr-orders-and-favourites--favourites-editor',
  'emr-authoring-field-generator--weight-with-loinc-and-ucum',
  'emr-templates-composer--multi-section-general-examination',
  'emr-templates-composer--preview'
] as const;

async function storyIds(page: import('@playwright/test').Page): Promise<string[]> {
  const response = await page.request.get('/index.json');
  if (!response.ok()) return [];
  const index = (await response.json()) as StoryIndex;
  const available = Object.entries(index.entries ?? {})
    .filter(([, entry]) => entry.type === 'story')
    .map(([id]) => id);
  return representativeStories.filter(id => available.includes(id));
}

test.describe('Storybook EMR catalogue smoke tests', () => {
  test('Storybook loads and exposes component stories', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#storybook-root, #root')).toBeAttached();
    const ids = await storyIds(page);
    expect(ids.length, 'Storybook should expose at least one story').toBeGreaterThan(0);
  });

  test('catalogue stories pass axe smoke checks in light and dark themes', async ({ page }) => {
    const ids = await storyIds(page);
    expect(ids.length, 'Storybook catalogue index must expose representative stories').toBeGreaterThan(0);

    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      for (const id of ids) {
        await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#storybook-root')).toBeAttached();
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
        await page.locator('.emr-story-surface').evaluateAll((elements, theme) => {
          for (const element of elements) {
            element.classList.toggle('emr-theme-dark', theme === 'dark');
            element.classList.toggle('emr-theme-light', theme === 'light');
          }
        }, colorScheme);
        await page.evaluate(axeSource);
        const results = await page.evaluate(async () => {
          const axe = (globalThis as any).axe;
          for (let attempt = 0; attempt < 20; attempt += 1) {
            try {
              return await axe.run(document, {
                resultTypes: ['violations'],
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
              });
            } catch (error) {
              if (!String(error).includes('Axe is already running')) throw error;
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          throw new Error('Axe remained busy after retrying');
        });
        expect(results.violations, `${id} (${colorScheme}) accessibility violations`).toEqual([]);
      }
    }
  });

  test('catalogue remains presentable at all configured breakpoints', async ({ page }, testInfo) => {
    const ids = await storyIds(page);
    expect(ids.length, 'Storybook catalogue index must expose representative stories').toBeGreaterThan(0);
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });

    for (const id of ids) {
      await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#storybook-root')).toBeVisible();
      const root = page.locator('#storybook-root');
      const box = await root.boundingBox();
      expect(box?.width ?? 0, `${id} should render at ${testInfo.project.name}`).toBeGreaterThan(0);
      expect(box?.height ?? 0, `${id} should have visible content`).toBeGreaterThan(0);
      const overflow = await page.locator('html').evaluate(element => element.scrollWidth - element.clientWidth);
      expect(overflow, `${id} should not introduce page-level horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });

  test('pre-selected select values display their option, not the placeholder', async ({ page }) => {
    // [label substring, expected option value]; labels are aria-label or the wrapping <label> text.
    const cases: Record<string, Array<[string, string]>> = {
      'emr-clinical-forms-history--history': [['Status', 'active']],
      'emr-clinical-forms-history--explicit-assessment-status': [['History of present illness assessment status', 'declined']],
      'emr-clinical-forms-system-examinations--general-and-systems': [['General appearance', 'well']],
      'emr-clinical-assessment--neurology-four-limb': [
        ['Tone, Left arm', 'increased'], ['Biceps reflex, Left arm', 'brisk'], ['Plantar response, Left leg', 'equivocal'], ['Plantar response, Right leg', 'down']
      ],
      'emr-medications-reconciliation--discharge-with-stops': [['Enoxaparin', 'stop'], ['Amlodipine', 'continue'], ['Paracetamol', 'modify'], ['Amoxicillin', 'new']]
    };
    for (const [id, expected] of Object.entries(cases)) {
      await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
      await page.locator('select').first().waitFor({ state: 'attached' });
      const selects = await page.locator('select').evaluateAll(elements => elements
        .filter(element => element.getClientRects().length > 0)
        .map(element => ({
          label: (element.getAttribute('aria-label') ?? (element as HTMLSelectElement).labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim(),
          value: (element as HTMLSelectElement).value
        })));
      for (const [label, value] of expected) {
        const match = selects.find(select => select.label.includes(label));
        expect(match, `${id}: no visible select labelled "${label}"`).toBeDefined();
        expect(match?.value, `${id}: "${label}" should display its stored value`).toBe(value);
      }
    }
  });

  test('keyboard navigation and read-only states remain operable', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-primitives--controls&viewMode=story', { waitUntil: 'domcontentloaded' });
    const tabs = page.getByRole('tab');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();

    await page.goto('/iframe.html?id=foundations-primitives--search-multi-select&viewMode=story', { waitUntil: 'domcontentloaded' });
    const search = page.getByRole('combobox', { name: 'Laboratory tests' });
    await search.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option').nth(1)).toBeFocused();

    await page.goto('/iframe.html?id=emr-clinical-assessment--encounter-timeline-horizontal&viewMode=story', { waitUntil: 'domcontentloaded' });
    const encounters = page.locator('.emr-timeline__button');
    await encounters.nth(1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(encounters.nth(2)).toBeFocused();

    await page.goto('/iframe.html?id=emr-clinical-assessment--ophthalmology-read-only&viewMode=story', { waitUntil: 'domcontentloaded' });
    const remarks = page.locator('.emr-matrix table:visible input[aria-label^="Remarks for"], .emr-matrix-card:visible input');
    await expect(remarks.first()).toHaveAttribute('readonly', '');

    await page.goto('/iframe.html?id=emr-safety-staged-checklist--read-only&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Checklist phases' }).getByRole('button').nth(1)).toBeEnabled();
    await expect(page.locator('.emr-staged-checklist__item input').first()).toBeDisabled();

    await page.goto('/iframe.html?id=emr-safety-staged-checklist--two-instances&viewMode=story', { waitUntil: 'domcontentloaded' });
    const allergyRadios = page.getByRole('group', { name: 'Allergy status reviewed' }).getByRole('radio');
    expect(await allergyRadios.nth(0).getAttribute('name')).not.toBe(await allergyRadios.nth(3).getAttribute('name'));
    await expect(page.getByRole('option', { name: 'Restricted by controller' }).first()).toHaveAttribute('disabled', '');

    await page.goto('/iframe.html?id=emr-safety-pac-checklist--default&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.emr-pac__context dd').first()).toContainText('Ananya Rao');
    await expect(page.getByRole('button', { name: 'Save draft' })).toBeEnabled();
    await page.goto('/iframe.html?id=emr-safety-pac-checklist--read-only&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Read only')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    await page.goto('/iframe.html?id=emr-safety-pac-checklist--errors&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.emr-pac__errors')).toContainText('Allergy and reaction details');

    const availableStories = await storyIds(page);
    if (availableStories.includes('emr-documents--integrated-click-to-open-journey')) {
      await page.goto('/iframe.html?id=emr-documents--integrated-click-to-open-journey&viewMode=story', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.emr-patient-documents__select:visible').first()).toBeVisible();
      await expect(page.locator('button:visible').filter({ hasText: /^Preview$/ }).first()).toBeVisible();
      const documentName = page.locator('.emr-patient-documents__select:visible').first();
      await documentName.focus();
      await documentName.click();
      const viewer = page.getByRole('dialog', { name: 'Discharge summary' });
      await expect(viewer).toBeVisible();
      await expect(viewer.getByRole('img', { name: /Synthetic preview/ })).toBeVisible();
      await viewer.getByRole('button', { name: 'Zoom in' }).click();
      await expect(viewer.getByText('125%')).toBeVisible();
      await viewer.getByRole('button', { name: 'Next page' }).click();
      await expect(viewer.getByRole('img', { name: /page 2/ })).toBeVisible();
      await viewer.getByRole('button', { name: 'Close document viewer' }).click();
      await expect(viewer).toBeHidden();
      await expect(documentName).toBeFocused();
    }

    await page.goto('/iframe.html?id=emr-clinical-assessment-ophthalmology--spectacle-prescription&viewMode=story', { waitUntil: 'domcontentloaded' });
    if ((page.viewportSize()?.width ?? 1280) <= 720) {
      await expect(page.getByRole('group', { name: 'Right eye (OD)' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Left eye (OS)' })).toBeVisible();
    } else {
      await expect(page.getByRole('table', { name: 'Spectacle prescription by eye' })).toBeVisible();
    }
    await expect(page.getByRole('textbox', { name: 'Sphere for Right eye' })).toBeEnabled();
    await page.goto('/iframe.html?id=emr-clinical-assessment-ophthalmology--spectacle-prescription-read-only&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Read only')).toBeVisible();
    await expect(page.locator('.emr-spectacle__value:visible').filter({ hasText: '-1.25' }).first()).toBeVisible();
    await page.goto('/iframe.html?id=emr-clinical-assessment-ophthalmology--spectacle-prescription-errors&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.emr-spectacle__errors')).toContainText('Review prescription entries');

    await page.goto('/iframe.html?id=emr-authoring-field-generator--weight-with-loinc-and-ucum&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('searchbox', { name: 'Search' }).first()).toBeEnabled();
    await expect(page.getByRole('button', { name: /Body weight/ })).toBeEnabled();

    await page.goto('/iframe.html?id=emr-templates-composer--readonly-published&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Template sections' }).getByRole('button', { name: 'History 1 field' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save template' })).toBeDisabled();

    await page.goto('/iframe.html?id=emr-templates-composer--preview&viewMode=story', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Format').selectOption('internal-json');
    await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled();

    for (const story of ['emr-authoring-field-generator--two-instances', 'emr-templates-composer--two-instances']) {
      await page.goto(`/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'domcontentloaded' });
      const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
      expect(new Set(ids).size, `${story} must not contain duplicate DOM ids`).toBe(ids.length);
    }
  });

  test('danger button hover maintains AA text contrast', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-primitives--controls&viewMode=story', { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    const danger = page.getByRole('button', { name: 'Delete' });
    for (const theme of ['light', 'dark'] as const) {
      await page.locator('.emr-story-surface').evaluateAll((elements, activeTheme) => {
        for (const element of elements) {
          element.classList.toggle('emr-theme-dark', activeTheme === 'dark');
          element.classList.toggle('emr-theme-light', activeTheme === 'light');
        }
      }, theme);
      await danger.hover();
      const ratio = await danger.evaluate(element => {
        const parse = (color: string) => color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        const luminance = (rgb: number[]) => {
          const linear = rgb.map(value => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; });
          return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
        };
        const style = getComputedStyle(element);
        const first = luminance(parse(style.color));
        const second = luminance(parse(style.backgroundColor));
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      });
      expect(ratio, `${theme} danger hover contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('peer primitive variants use equal component heights', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-primitives--controls&viewMode=story', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.emr-chip-row')).toBeVisible();
    await expect(page.locator('.emr-button-row')).toBeVisible();
    await expect(page.locator('.emr-tabs')).toBeVisible();

    const heights = async (selector: string): Promise<number[]> =>
      page.locator(selector).evaluateAll(elements =>
        elements.filter(element => getComputedStyle(element).display !== 'none').map(element => element.getBoundingClientRect().height)
      );

    const compactHeights = await heights('.emr-chip-row .emr-badge, .emr-chip-row .emr-chip');
    expect(new Set(compactHeights)).toEqual(new Set([32]));

    const buttonHeights = await heights('.emr-button-row .emr-button');
    expect(new Set(buttonHeights)).toEqual(new Set([44]));

    const tabHeights = await heights('.emr-tabs .emr-tab');
    expect(new Set(tabHeights)).toEqual(new Set([44]));

    const pairedBoxes = await page.locator('#demo-pair-first, #demo-pair-second').evaluateAll(elements =>
      elements.map(element => {
        const box = element.getBoundingClientRect();
        return { width: box.width, height: box.height, top: box.top };
      })
    );
    expect(pairedBoxes).toHaveLength(2);
    expect(pairedBoxes.every(box => box.width <= 132 && box.height === 44)).toBe(true);
    expect(new Set(pairedBoxes.map(box => box.top)).size).toBe(1);
  });

  test('annotation marks stay registered to the image at every width', async ({ page }) => {
    // Surgery planning: a 1400x900 template with a line drawn from (0.2, 0.46) to (0.8, 0.54).
    // Retina pairs: 1000x900. Each runs at the project's 360/768/1280px viewport.
    for (const id of ['emr-clinical-photo-annotation--surgery-planning', 'emr-clinical-photo-annotation--retina-pairs']) {
      await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
      const image = page.locator('.emr-annotation-canvas__image');
      await expect(image).toBeVisible();
      await image.evaluate(element => (element as HTMLImageElement).decode());
      const boxes = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const img = document.querySelector('.emr-annotation-canvas__image') as HTMLImageElement;
        return { image: rect('.emr-annotation-canvas__image'), overlay: rect('.emr-annotation-canvas__overlay'), natural: img.naturalWidth / img.naturalHeight };
      });
      // No letterboxing: the overlay coincides with the image, which keeps its own proportions.
      for (const side of ['x', 'y', 'width', 'height'] as const) expect(boxes.overlay[side]).toBeCloseTo(boxes.image[side], 0);
      expect(boxes.image.width / boxes.image.height).toBeCloseTo(boxes.natural, 2);
    }

    await page.goto('/iframe.html?id=emr-clinical-photo-annotation--surgery-planning&viewMode=story');
    const lineBox = await page.locator('.emr-annotation-canvas__overlay line').first().boundingBox();
    const imageBox = await page.locator('.emr-annotation-canvas__image').boundingBox();
    expect((lineBox!.x - imageBox!.x) / imageBox!.width).toBeCloseTo(0.2, 1);
    expect((lineBox!.x + lineBox!.width - imageBox!.x) / imageBox!.width).toBeCloseTo(0.8, 1);
  });

  test('representative workflows match visual baselines', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('chromium'), 'One browser engine owns deterministic visual baselines.');
    const ids = [
      'foundations-primitives--controls',
      'emr-patient-and-navigation--patient-card',
      'emr-clinical-assessment--ophthalmology-odos',
      'emr-clinical-assessment--neurology-four-limb',
      'emr-orders-and-favourites--laboratory-hierarchy',
      'emr-orders-and-favourites--favourites-list',
      'foundations-layout-primitives--separators',
      'foundations-layout-primitives--single-card',
      'foundations-layout-primitives--two-column',
      'foundations-layout-primitives--three-column-weighted',
      'foundations-layout-primitives--field-value-remarks-notes',
      'foundations-likert-scale--pain-score',
      'foundations-likert-scale--unselected',
      'foundations-likert-scale--all-zones',
      'foundations-likert-scale--custom-range',
      'foundations-likert-scale--with-error',
      'foundations-likert-scale--read-only',
      'foundations-likert-scale--disabled',
      'foundations-vas-scale--pain-vas',
      'foundations-vas-scale--health-thermometer',
      'foundations-vas-scale--unmarked',
      'foundations-vas-scale--read-only-vas',
      'foundations-vas-scale--with-error',
      'foundations-vas-scale--disabled-vas'
    ];

    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      for (const id of ids) {
        await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#storybook-root')).toBeVisible();
        await page.locator('.emr-story-surface').evaluateAll((elements, theme) => {
          for (const element of elements) {
            element.classList.toggle('emr-theme-dark', theme === 'dark');
            element.classList.toggle('emr-theme-light', theme === 'light');
          }
        }, colorScheme);
        await expect(page).toHaveScreenshot(`${id}-${colorScheme}.png`, {
          animations: 'disabled',
          fullPage: true,
          maxDiffPixelRatio: 0.01
        });
      }
    }
  });
});

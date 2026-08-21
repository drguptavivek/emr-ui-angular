import type { Preview } from '@storybook/angular';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'EMR colour theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' }
        ],
        dynamicTitle: true
      }
    },
    print: {
      description: 'Preview the paper layout on screen',
      defaultValue: 'screen',
      toolbar: {
        title: 'Print',
        icon: 'print',
        items: [
          { value: 'screen', title: 'Screen', icon: 'browser' },
          { value: 'record', title: 'Print — record', icon: 'document' },
          { value: 'form', title: 'Print — blank form', icon: 'edit' }
        ],
        dynamicTitle: true
      }
    }
  },
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'error' },
    backgrounds: { disable: true }
  },
  decorators: [
    (story, context) => {
      const rendered = story();
      const themeClass = context.globals['theme'] === 'dark' ? 'emr-theme-dark' : 'emr-theme-light';
      const printMode = context.globals['print'] ?? 'screen';
      // Print always renders on the light palette; a dark-theme print would
      // consume a cartridge and read poorly on paper.
      const surfaceClass = printMode === 'screen' ? themeClass : 'emr-theme-light';
      const printClass =
        printMode === 'form' ? ' emr-print emr-print--form' : printMode === 'record' ? ' emr-print' : '';
      return {
        ...rendered,
        template: `<div class="${surfaceClass}${printClass} emr-story-surface">${rendered.template ?? ''}</div>`
      };
    }
  ],
  tags: ['autodocs']
};

export default preview;

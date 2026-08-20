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
      return {
        ...rendered,
        template: `<div class="${themeClass} emr-story-surface">${rendered.template ?? ''}</div>`
      };
    }
  ],
  tags: ['autodocs']
};

export default preview;

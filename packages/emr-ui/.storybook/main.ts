import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|mjs|ts)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // L5 anatomy outlines, served where stories resolve recipe assets.
  staticDirs: [{ from: '../src/lib/recipes/anatomy/assets', to: '/assets/anatomy' }],
  framework: {
    name: '@storybook/angular',
    options: {}
  }
};

export default config;

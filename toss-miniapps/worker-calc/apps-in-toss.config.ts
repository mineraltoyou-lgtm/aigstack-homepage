import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'worker-calc',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
  },
  webBundleDir: 'dist',
});

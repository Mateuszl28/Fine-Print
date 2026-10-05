import type { CapacitorConfig } from '@capacitor/cli';

// The Android app is a thin shell around the deployed site, so the analysis
// (which needs the server) works the same as in the browser.
const config: CapacitorConfig = {
  appId: 'com.mateuszl28.fineprint',
  appName: 'Fine Print',
  webDir: 'mobile/www',
  server: {
    url: 'https://fine-print-khaki.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#F4EFE6',
  },
};

export default config;

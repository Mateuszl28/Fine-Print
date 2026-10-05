import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fine Print',
    short_name: 'Fine Print',
    description: 'Read the contract before you sign it: traps marked on the page, the true cost, and the letter to get out.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4EFE6',
    theme_color: '#F4EFE6',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

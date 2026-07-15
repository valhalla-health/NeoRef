/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base keeps the build portable across GitHub Pages project/user sites
// without hardcoding the repository name.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Newborn · In-Hand Reference',
        short_name: 'NeoRef',
        description:
          'Neonatal educational reference — calculators, protocols, and a daily lesson track. Not for clinical decision-making.',
        theme_color: '#F6EFE3',
        background_color: '#1F1812',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell + all bundled assets (JS/CSS/fonts/icons) so the
        // app genuinely works offline — no CDN, no runtime font fetches. Lesson
        // content (public/lessons/*.json, ~6.5MB across 159 files) is deliberately
        // NOT in this glob — eagerly precaching it would bloat the install. It's
        // cached lazily instead, once a lesson is actually opened (see below).
        globPatterns: ['**/*.{js,css,html,png,woff,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\/lessons\/day-\d+\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lesson-content',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'src/main.tsx', // entry point — no logic to unit test
        'src/vite-env.d.ts',
        'src/test/**',
        '**/*.config.*',
      ],
    },
  },
});

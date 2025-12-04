import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestOptions } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

// Get version from package.json
const getVersion = () => {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
};

// Get git commit hash
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

const getBuildTime = () => {
  return new Date().toISOString();
};

const repoBasePath = '/Grocery_Sale_Price_Evaluator/';

const getBranchBasePath = () => {
  // If building on Vercel, always use root path
  if (process.env.VERCEL) {
    return '/';
  }

  // GitHub Pages needs the repo path
  const raw = process.env.BRANCH_BASE_PATH ?? '';
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    return repoBasePath;
  }
  return `${repoBasePath}${trimmed}/`;
};

const getAppName = () => {
  // Use dev name for Vercel builds
  if (process.env.VERCEL) {
    return 'LunaCart_Dev';
  }
  const raw = process.env.APP_NAME_OVERRIDE;
  return raw && raw.trim().length > 0 ? raw.trim() : 'LunaCart';
};

const getAppShortName = () => {
  // Use dev short name for Vercel builds
  if (process.env.VERCEL) {
    return 'LC_Dev';
  }
  const raw = process.env.APP_SHORT_NAME_OVERRIDE;
  return raw && raw.trim().length > 0 ? raw.trim() : 'LunaCart';
};

const getAppDescription = () => {
  // Use dev description for Vercel builds
  if (process.env.VERCEL) {
    return 'Development build - Testing new features';
  }
  const raw = process.env.APP_DESCRIPTION_OVERRIDE;
  return raw && raw.trim().length > 0
    ? raw.trim()
    : 'Illuminate the Best Deals - Check if prices are good deals, create shopping lists, and track prices across stores.';
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getScope = () => getBranchBasePath();

const getManifestId = () => {
  const raw = process.env.MANIFEST_ID_OVERRIDE;
  if (raw && raw.trim().length > 0) {
    const normalized = raw.trim().startsWith('/') ? raw.trim() : `/${raw.trim()}`;
    return normalized;
  }
  return getScope();
};

const getIcons = () => {
  // Use simple generic icons for Vercel dev builds
  if (process.env.VERCEL) {
    // Simple orange/pink gradient square with "DEV" text
    const devIcon192 = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgb(249,115,22);stop-opacity:1"/><stop offset="100%" style="stop-color:rgb(236,72,153);stop-opacity:1"/></linearGradient></defs><rect width="192" height="192" fill="url(%23grad)"/><text x="96" y="120" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">DEV</text></svg>';
    const devIcon512 = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgb(249,115,22);stop-opacity:1"/><stop offset="100%" style="stop-color:rgb(236,72,153);stop-opacity:1"/></linearGradient></defs><rect width="512" height="512" fill="url(%23grad)"/><text x="256" y="320" font-family="Arial,sans-serif" font-size="128" font-weight="bold" fill="white" text-anchor="middle">DEV</text></svg>';

    return [
      {
        src: devIcon192,
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: devIcon512,
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ];
  }

  // Production icons for GitHub Pages
  const base = stripTrailingSlash(getScope());
  const toIconPath = (file: string) => `${base}/${file}`;
  return [
    {
      src: toIconPath('icons/192x192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: toIconPath('icons/512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: toIconPath('icons/512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ];
};

const getManifest = (): Partial<ManifestOptions> => ({
  id: getManifestId(),
  name: getAppName(),
  short_name: getAppShortName(),
  description: getAppDescription(),
  start_url: getScope(),
  scope: getScope(),
  display: 'standalone',
  display_override: ['window-controls-overlay', 'standalone'],
  orientation: 'portrait-primary',
  background_color: '#0f172a',
  theme_color: '#7c3aed',
  categories: ['shopping', 'utilities'],
  icons: getIcons(),
});

export default defineConfig(({ command }) => ({
  base: command === 'build' ? getBranchBasePath() : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  define: {
    '__APP_VERSION__': JSON.stringify(`${getVersion()} (${getGitHash()})`),
    '__BUILD_TIME__': JSON.stringify(getBuildTime()),
    '__APP_NAME__': JSON.stringify(getAppName()),
    '__APP_SHORT_NAME__': JSON.stringify(getAppShortName()),
    '__APP_DESCRIPTION__': JSON.stringify(getAppDescription()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: getManifest(),
      includeAssets: ['icons/192x192.png', 'icons/512x512.png'],
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            },
          },
          {
            urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'asset-cache',
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    logOverride: {
      'ignored-directive': 'silent',
    },
  },
  logLevel: 'info',
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // ignore certain harmless warnings
        if (
          warning.message.includes('Module level directives') ||
          warning.message.includes('"use client"') ||
          warning.message.includes('"was ignored"')
        ) {
          return;
        }

        // FAIL build on unresolved imports
        if (warning.code === 'UNRESOLVED_IMPORT') {
          throw new Error(`Build failed due to unresolved import:\n${warning.message}`);
        }

        // FAIL build on missing exports (like your Input error)
        if (warning.code === 'PLUGIN_WARNING' && /is not exported/.test(warning.message)) {
          throw new Error(`Build failed due to missing export:\n${warning.message}`);
        }

        // other warnings: log normally
        warn(warning);
      },
    },
  },
}));
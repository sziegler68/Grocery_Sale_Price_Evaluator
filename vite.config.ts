import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestOptions } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

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
  const base = stripTrailingSlash(getScope());
  const toIconPath = (file: string) => `${base}/${file}`;
  return [
    {
      src: toIconPath('icons/192x192.png'),
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: toIconPath('icons/512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
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
  background_color: '#0f172a',
  theme_color: '#7c3aed',
  icons: getIcons(),
});

export default defineConfig(({ command }) => ({
  base: command === 'build' ? getBranchBasePath() : '/',
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
          warning.message.includes('"use client"')  ||
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
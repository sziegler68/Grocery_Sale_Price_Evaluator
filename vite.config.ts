import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Grocery_Sale_Price_Evaluator/' : '/',
  define: {
    '__APP_VERSION__': JSON.stringify(`${getVersion()} (${getGitHash()})`),
    '__BUILD_TIME__': JSON.stringify(getBuildTime()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
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
import React from 'react';

// Version info injected at build time
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

const Footer: React.FC = () => {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' 
    ? new Date(__BUILD_TIME__).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'development';

  return (
    <footer className="bg-zinc-800 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-zinc-400">
            © 2025 Grocery Price Tracker. All rights reserved.
          </p>
          <p className="text-sm text-zinc-400 mt-2">
            Built with ❤️ by <a rel="nofollow" target="_blank" href="https://meku.dev" className="text-purple-400 hover:text-purple-300">Meku.dev</a>
          </p>
          <p className="text-xs text-zinc-500 mt-3">
            Version: <span className="font-mono text-purple-400">{version}</span>
            {' • '}
            <span className="text-zinc-600">{buildTime}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
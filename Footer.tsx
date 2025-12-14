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
    <footer className="bg-card text-primary py-8 mt-16 border-t border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-secondary">
            © 2025 LunaCart. All rights reserved.
          </p>
          <p className="text-sm text-secondary mt-2">
            Built with 💚 by Greenie App Builder
          </p>
          <p className="text-xs text-tertiary mt-3">
            Version: <span className="font-mono text-brand">{version}</span>
            {' • '}
            <span className="text-tertiary">{buildTime}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
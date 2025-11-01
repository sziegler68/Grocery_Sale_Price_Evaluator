import React from 'react';

const Footer: React.FC = () => {
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
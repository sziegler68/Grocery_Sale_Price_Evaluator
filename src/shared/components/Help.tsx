import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, ShoppingCart, DollarSign, Settings as SettingsIcon,
  ArrowRight, ChevronDown, ChevronRight, Search, Bot, Sparkles
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useDarkMode } from '../hooks/useDarkMode';

interface HelpSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  searchMatch?: boolean;
}

const HelpSection: React.FC<HelpSectionProps> = ({
  id, title, icon, isExpanded, onToggle, children, searchMatch
}) => {
  return (
    <div className={`rounded-xl shadow-lg mb-4 bg-card overflow-hidden transition-all ${searchMatch ? 'ring-2 ring-brand' : ''
      }`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h2 className="text-lg font-bold text-left">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-secondary" />
        ) : (
          <ChevronRight className="h-5 w-5 text-secondary" />
        )}
      </button>
      {isExpanded && (
        <div id={`section-${id}`} className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const Help: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Section definitions with searchable content
  const sections = useMemo(() => [
    {
      id: 'overview',
      title: '🌙 What is LunaCart?',
      keywords: ['lunacart', 'app', 'features', 'price', 'shopping', 'list', 'budget', 'trip']
    },
    {
      id: 'luna',
      title: '🤖 Luna - Your Mini Assistant',
      keywords: ['luna', 'assistant', 'voice', 'commands', 'add', 'rename', 'delete', 'help', 'ai', 'suggestions']
    },
    {
      id: 'price-checker',
      title: '💵 Price Checker',
      keywords: ['price', 'check', 'target', 'deal', 'compare', 'unit', 'conversion']
    },
    {
      id: 'shopping-lists',
      title: '🛒 Shopping Lists',
      keywords: ['list', 'share', 'code', 'create', 'join', 'items', 'category']
    },
    {
      id: 'shopping-trip',
      title: '🛍️ Active Shopping Trip',
      keywords: ['trip', 'budget', 'cart', 'tax', 'crv', 'spending', 'meter']
    },
    {
      id: 'settings',
      title: '⚙️ Settings',
      keywords: ['settings', 'preferences', 'units', 'tax', 'notifications', 'alexa']
    },
    {
      id: 'tips',
      title: '💡 Tips & Tricks',
      keywords: ['tips', 'workflow', 'filter', 'best', 'security']
    },
    {
      id: 'reference',
      title: '📚 Quick Reference',
      keywords: ['reference', 'navigation', 'colors', 'quick']
    }
  ], []);

  // Filter sections based on search
  const matchingSections = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const query = searchQuery.toLowerCase();
    return new Set(
      sections
        .filter(s =>
          s.title.toLowerCase().includes(query) ||
          s.keywords.some(k => k.includes(query))
        )
        .map(s => s.id)
    );
  }, [searchQuery, sections]);

  // Auto-expand matching sections when searching
  const visibleExpanded = useMemo(() => {
    if (searchQuery.trim()) {
      return matchingSections;
    }
    return expandedSections;
  }, [searchQuery, matchingSections, expandedSections]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isExpanded = (id: string) => visibleExpanded.has(id);
  const isMatch = (id: string) => searchQuery.trim() !== '' && matchingSections.has(id);

  return (
    <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <HelpCircle className="h-8 w-8 text-brand" />
            <h1 className="text-3xl font-bold">Help & Guide</h1>
          </div>
          <p className="text-primary">
            Learn how to use LunaCart to illuminate the best deals and organize your shopping
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-card border-primary focus:ring-2 focus:ring-brand focus:border-transparent text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sections */}
        <HelpSection
          id="overview"
          title="🌙 What is LunaCart?"
          icon={<Sparkles className="h-5 w-5 text-purple-500" />}
          isExpanded={isExpanded('overview')}
          onToggle={() => toggleSection('overview')}
          searchMatch={isMatch('overview')}
        >
          <p className="text-primary mb-4">
            This app has <strong>three main features</strong> that work together:
          </p>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-brand-light">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">1. Price Checker</h3>
              </div>
              <p className="text-sm text-primary">
                Check if prices are good deals by comparing to your targets. Build a database of prices for items you buy regularly.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">2. Shopping Lists</h3>
              </div>
              <p className="text-sm text-primary">
                Create and share lists with family. See target prices while shopping to quickly spot good deals.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">3. Active Shopping Trip</h3>
              </div>
              <p className="text-sm text-primary">
                Track spending in real-time with a budget meter. Add items, compare prices, and stay on budget.
              </p>
            </div>
          </div>
        </HelpSection>

        <HelpSection
          id="luna"
          title="🤖 Luna - Your Mini Assistant"
          icon={<Bot className="h-5 w-5 text-purple-500" />}
          isExpanded={isExpanded('luna')}
          onToggle={() => toggleSection('luna')}
          searchMatch={isMatch('luna')}
        >
          <div className="space-y-4">
            <p className="text-primary">
              Luna is your voice-enabled shopping assistant that appears at the bottom of your shopping list.
              She helps you manage items quickly without navigating menus.
            </p>

            <div className="p-4 rounded-lg bg-brand-light">
              <h3 className="font-semibold mb-2">What Luna Can Do:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Add items:</strong> "add milk" or "add 2 pounds of chicken"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Remove items:</strong> "remove eggs" or "delete the bread"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Rename lists:</strong> "rename my list to Weekly Groceries"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Delete lists:</strong> "delete my Weekly list"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Get help:</strong> "help" or "what can you do?"</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-secondary">
              <h3 className="font-semibold mb-2">How to Use Luna:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary">
                <li>Open any shopping list</li>
                <li>Look for Luna's input bar at the bottom</li>
                <li>Type a command or tap the microphone to speak</li>
                <li>Luna will confirm and execute the action</li>
              </ol>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <h3 className="font-semibold mb-2">💡 Luna Suggestions</h3>
              <p className="text-sm text-primary">
                Luna can suggest items based on your shopping patterns. Toggle this feature in
                <strong> Settings → Luna Suggestions</strong>.
              </p>
            </div>

            <p className="text-sm text-secondary italic">
              Note: Luna is action-focused, not a chatbot. She executes shopping commands rather than having conversations.
            </p>
          </div>
        </HelpSection>

        <HelpSection
          id="price-checker"
          title="💵 Price Checker"
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          isExpanded={isExpanded('price-checker')}
          onToggle={() => toggleSection('price-checker')}
          searchMatch={isMatch('price-checker')}
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How to Check Prices:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Click <strong>"Price Checker"</strong></li>
                <li>Start typing item name - auto-suggests from database</li>
                <li>Select category and quality if applicable</li>
                <li>Enter price - type numbers, it auto-formats (1234 → $12.34)</li>
                <li>Set target price - auto-fills for future checks</li>
                <li>See if it's above/below/at target!</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Color Indicators:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li><span className="text-red-600">🔴</span> Red = Above target (expensive)</li>
                <li><span className="text-cyan-600">🔵</span> Cyan = Below target (good deal)</li>
                <li><span className="text-green-600">🟢</span> Green = Best price ever!</li>
                <li><span className="text-amber-500">🚩</span> Flag = Estimated weight used</li>
              </ul>
            </div>
          </div>
        </HelpSection>

        <HelpSection
          id="shopping-lists"
          title="🛒 Shopping Lists"
          icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
          isExpanded={isExpanded('shopping-lists')}
          onToggle={() => toggleSection('shopping-lists')}
          searchMatch={isMatch('shopping-lists')}
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Creating a List:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Click <strong>"Shopping Lists"</strong> in navigation</li>
                <li>Click <strong>"Create New List"</strong></li>
                <li>Enter a name (e.g., "Weekly Groceries")</li>
                <li>You'll get a share code like <code className="bg-purple-100 dark:bg-zinc-700 px-2 py-1 rounded">SHOP-K7P2M9</code></li>
                <li>Share the code with family/friends</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Joining a List:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Get a share code from someone</li>
                <li>Click <strong>"Join Existing List"</strong></li>
                <li>Enter the code</li>
                <li>You can now add/edit items!</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">While Shopping:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Items grouped by category</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Check off items as you buy - they move to bottom</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Target prices shown for quick reference</span>
                </li>
              </ul>
            </div>
          </div>
        </HelpSection>

        <HelpSection
          id="shopping-trip"
          title="🛍️ Active Shopping Trip"
          icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
          isExpanded={isExpanded('shopping-trip')}
          onToggle={() => toggleSection('shopping-trip')}
          searchMatch={isMatch('shopping-trip')}
        >
          <div className="space-y-6">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className="text-sm text-primary">
                Track spending in real-time. Set a budget, add items, and watch the meter update instantly!
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Starting a Trip:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Open a shopping list</li>
                <li>Click <strong>"Start Shopping Trip"</strong></li>
                <li>Set budget (type "150" for $150)</li>
                <li>Select store and tax rate</li>
                <li>Click <strong>"Start Shopping"</strong></li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Budget Meter:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li><span className="text-green-600">●</span> <strong>Green (0-89%)</strong> - Under budget</li>
                <li><span className="text-yellow-600">●</span> <strong>Yellow (90-99%)</strong> - Approaching limit</li>
                <li><span className="text-red-600">●</span> <strong>Red (100%+)</strong> - Over budget!</li>
              </ul>
            </div>
          </div>
        </HelpSection>

        <HelpSection
          id="settings"
          title="⚙️ Settings"
          icon={<SettingsIcon className="h-5 w-5 text-purple-600" />}
          isExpanded={isExpanded('settings')}
          onToggle={() => toggleSection('settings')}
          searchMatch={isMatch('settings')}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Unit Preferences:</h3>
              <p className="text-sm text-primary mb-2">
                Set preferred units per category for normalized price comparison:
              </p>
              <ul className="space-y-1 text-sm text-primary ml-4">
                <li><strong>Meat:</strong> pound or ounce</li>
                <li><strong>Dairy/Drinks:</strong> gallon, quart, liter, etc.</li>
                <li><strong>Produce:</strong> pound or each</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sales Tax:</h3>
              <p className="text-sm text-primary">
                Set your local tax rate for accurate cart totals during shopping trips.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Alexa Integration:</h3>
              <p className="text-sm text-primary">
                Generate a sync code to connect your Echo device. Say "Alexa, open Luna Cart" to manage lists by voice!
              </p>
            </div>
          </div>
        </HelpSection>

        <HelpSection
          id="tips"
          title="💡 Tips & Tricks"
          icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
          isExpanded={isExpanded('tips')}
          onToggle={() => toggleSection('tips')}
          searchMatch={isMatch('tips')}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Best Workflow:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-primary ml-4">
                <li>Build target prices with <strong>Price Checker</strong></li>
                <li>Create a <strong>Shopping List</strong> with those targets</li>
                <li>At store, tap <strong>"Start Shopping Trip"</strong></li>
                <li>Add items - green = good deal!</li>
                <li>Watch budget meter, remove items if over</li>
                <li>Save prices to database when done</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Security Note:</h3>
              <p className="text-sm text-primary">
                <strong>Price Database:</strong> Public - everyone can add prices<br />
                <strong>Shopping Lists:</strong> Private - only share code holders can see them
              </p>
            </div>
          </div>
        </HelpSection>

        <HelpSection
          id="reference"
          title="📚 Quick Reference"
          icon={<HelpCircle className="h-5 w-5 text-blue-500" />}
          isExpanded={isExpanded('reference')}
          onToggle={() => toggleSection('reference')}
          searchMatch={isMatch('reference')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary">
              <h3 className="font-semibold mb-2 text-sm">Navigation</h3>
              <ul className="space-y-1 text-xs text-primary">
                <li><strong>Home:</strong> Quick access to features</li>
                <li><strong>Price Checker:</strong> Check deals</li>
                <li><strong>Shopping Lists:</strong> Your shared lists</li>
                <li><strong>Search Database:</strong> All prices</li>
                <li><strong>Settings:</strong> Preferences</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-secondary">
              <h3 className="font-semibold mb-2 text-sm">Color Codes</h3>
              <ul className="space-y-1 text-xs text-primary">
                <li><span className="text-red-600">🔴</span> Red = Above target</li>
                <li><span className="text-cyan-600">🔵</span> Cyan = Below target</li>
                <li><span className="text-green-600">🟢</span> Green = Best price</li>
                <li><span className="text-purple-600">🟣</span> Purple = Normal</li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Call to Action */}
        <div className={`p-6 rounded-xl shadow-lg text-center mt-6 ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-purple-100 to-pink-100'}`}>
          <h2 className="text-2xl font-bold mb-4">Ready to Illuminate the Best Deals?</h2>
          <p className="text-primary mb-6">Start using LunaCart to never overpay again!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/add-item"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Check Your First Price
            </Link>
            <Link
              to="/shopping-lists"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Shopping List
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;

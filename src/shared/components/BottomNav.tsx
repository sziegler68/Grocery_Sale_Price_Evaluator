import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, List, Search, ShoppingCart, Settings as SettingsIcon, HelpCircle } from 'lucide-react';

interface BottomNavProps {
    hasActiveTrip?: boolean;
    darkMode?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ hasActiveTrip = false, darkMode = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/shopping-lists', icon: List, label: 'Lists' },
        { path: '/price-check', icon: Search, label: 'Price Check' },
        ...(hasActiveTrip ? [{ path: '/active-trip', icon: ShoppingCart, label: 'Active Trip' }] : []),
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
        { path: '/help', icon: HelpCircle, label: 'Help' },
    ];

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} border-t shadow-lg z-40`}>
            <div className="max-w-7xl mx-auto px-2">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active
                                        ? 'text-brand'
                                        : darkMode
                                            ? 'text-gray-400 hover:text-gray-200'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`h-6 w-6 ${active ? 'stroke-2' : ''}`} />
                                <span className={`text-xs mt-1 ${active ? 'font-semibold' : 'font-normal'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;

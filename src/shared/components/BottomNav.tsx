import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, List, Search, ShoppingCart, Settings as SettingsIcon } from 'lucide-react';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/shopping-lists', icon: List, label: 'Lists' },
        { path: '/scan', icon: Search, label: 'Price Check' },
        { path: '/active-trip', icon: ShoppingCart, label: 'Trip', alwaysShow: true },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-1">
                <div className="flex justify-around items-center h-14">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? 'text-brand' : 'text-secondary hover:text-primary'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${active ? 'stroke-2' : ''}`} />
                                <span className={`text-[10px] mt-0.5 ${active ? 'font-semibold' : 'font-normal'}`}>
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

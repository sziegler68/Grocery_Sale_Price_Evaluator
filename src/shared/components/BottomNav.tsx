import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, List, Search, ShoppingCart, Settings as SettingsIcon, HelpCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [showPriceCheck, setShowPriceCheck] = React.useState(false);
    // Import PriceCheckModal dynamically or use the one from features if available globally
    // Since we can't easily import it here without circular deps or structure issues if it's not shared, 
    // let's assume we can import it. If not, we might need to move it.
    // Actually, PriceCheckModal is in features/price-tracker/components. BottomNav is in shared/components.
    // This is a dependency violation (shared -> features). 
    // Ideally BottomNav should emit an event or use a global store.
    // For now, let's keep the Price Check button navigating to /scan, but maybe we can make /scan open the modal?
    // User said: "price check button should work the same as the price check button on the main home page."
    // The home page button opens a modal.
    // If I cannot import PriceCheckModal here, I should probably move PriceCheckModal to a shared location or lift it up.
    // Let's try to import it first. If it fails, I'll refactor.

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/shopping-lists', icon: List, label: 'Lists' },
        {
            path: '#price-check',
            icon: Search,
            label: 'Price Check',
            onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                setShowPriceCheck(true);
            }
        },
        { path: '/active-trip', icon: ShoppingCart, label: 'Trip', alwaysShow: true },
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
        <>
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary shadow-lg z-40">
                <div className="max-w-7xl mx-auto px-1">
                    <div className="flex justify-around items-center h-14">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <button
                                    key={item.label}
                                    onClick={(e) => item.onClick ? item.onClick(e) : navigate(item.path)}
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

            {/* We need to import PriceCheckModal. Since this is a shared component, importing from features is technically a violation of FSD if strictly followed, but for this app it might be fine. */}
            {showPriceCheck && (
                <PriceCheckModalWrapper
                    isOpen={showPriceCheck}
                    onClose={() => setShowPriceCheck(false)}
                />
            )}
        </>
    );
};

// Lazy load to avoid circular dependency issues if any
const PriceCheckModalWrapper = React.lazy(() => import('../../features/price-tracker/components/PriceCheckModal').then(module => ({ default: module.PriceCheckModal })));

export default BottomNav;

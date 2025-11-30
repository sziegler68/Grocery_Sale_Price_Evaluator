import React, { useState, useEffect } from 'react';
import { ShoppingCart, List, Search, Camera, Plus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import { getStoredShareCodes } from '../../../shared/utils/shoppingListStorage';
import { getShoppingListsByCodes, getItemsForList } from '../../shopping-lists/api';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const userName = JSON.parse(localStorage.getItem('userProfile') || '{}').name || 'Shopper';

    // Load real shopping lists
    const [recentLists, setRecentLists] = useState<Array<{ id: string; name: string; itemCount: number; sharedWith: string[] }>>([]);

    useEffect(() => {
        const loadLists = async () => {
            try {
                const shareCodes = getStoredShareCodes();
                if (shareCodes.length === 0) {
                    setRecentLists([]);
                    return;
                }

                const lists = await getShoppingListsByCodes(shareCodes);

                // Load item counts for each list
                const listsWithCounts = await Promise.all(
                    lists.slice(0, 3).map(async (list) => {
                        const items = await getItemsForList(list.id);
                        return {
                            id: list.share_code,
                            name: list.name,
                            itemCount: items.length,
                            sharedWith: [] // TODO: Get actual shared users if needed
                        };
                    })
                );

                setRecentLists(listsWithCounts);
            } catch (error) {
                console.error('Failed to load shopping lists:', error);
                setRecentLists([]);
            }
        };

        loadLists();
    }, []);

    // Mock data for active trip (TODO: implement trip tracking)
    const activeTrip = null;

    return (
        <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
                {/* Welcome Header */}
                <section className="bg-card rounded-2xl p-6 shadow-lg border border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Welcome back, {userName}!</h1>
                            <p className="text-secondary mt-1">Ready to find the best deals?</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xl">
                            {userName[0]}
                        </div>
                    </div>
                </section>

                {/* Hero Section: Active Trip or Start New */}
                <section>
                    {activeTrip ? (
                        <div className="bg-gradient-to-br from-brand to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Active Trip: Safeway
                                </h2>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                    In Progress
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1 text-purple-100">
                                        <span>Spent: $45.50</span>
                                        <span>Budget: $100.00</span>
                                    </div>
                                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white w-[45%] rounded-full" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/trip/1')}
                                    className="w-full py-3 bg-white text-brand font-bold rounded-xl shadow hover:bg-purple-50 transition-colors"
                                >
                                    Resume Shopping
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-brand to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                            <h2 className="font-bold text-xl mb-2">Ready to shop?</h2>
                            <p className="text-purple-100 mb-6">Start a new trip to track your budget and scan deals.</p>
                            <button
                                onClick={() => navigate('/start-trip')}
                                className="w-full py-3 bg-white text-brand font-bold rounded-xl shadow hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                Start New Trip
                            </button>
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/scan')}
                        className="p-4 bg-card rounded-xl border border-primary shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2"
                    >
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Camera className="h-6 w-6" />
                        </div>
                        <span className="font-medium text-primary">Scan Item</span>
                    </button>
                    <button
                        onClick={() => navigate('/items')}
                        className="p-4 bg-card rounded-xl border border-primary shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2"
                    >
                        <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Search className="h-6 w-6" />
                        </div>
                        <span className="font-medium text-primary">Price Check</span>
                    </button>
                </section>

                {/* Recent Lists */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                            <List className="h-5 w-5" />
                            Your Lists
                        </h2>
                        <button
                            onClick={() => navigate('/shopping-lists')}
                            className="text-brand text-sm font-medium hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentLists.map(list => (
                            <div
                                key={list.id}
                                onClick={() => navigate(`/shopping-lists/${list.id}`)}
                                className="p-4 bg-card rounded-xl border border-primary shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-semibold text-primary">{list.name}</h3>
                                    <p className="text-sm text-gray-500">{list.itemCount} items • {list.sharedWith.length > 0 ? `Shared with ${list.sharedWith.join(', ')}` : 'Private'}</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                    <ArrowRightIcon className="h-4 w-4" />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => navigate('/shopping-lists/new')}
                            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Create New List
                        </button>
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary pb-safe shadow-lg">
                <div className="max-w-4xl mx-auto flex justify-around p-2">
                    <NavButton icon={<TrendingUp />} label="Home" active />
                    <NavButton icon={<List />} label="Lists" onClick={() => navigate('/shopping-lists')} />
                    <NavButton icon={<Search />} label="Items" onClick={() => navigate('/items')} />
                    <NavButton icon={<SettingsIcon />} label="Settings" onClick={() => navigate('/settings')} />
                </div>
            </nav>

            <Footer />
        </div>
    );
};

const NavButton: React.FC<{ icon: React.ReactElement; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 transition-colors ${active ? 'text-brand' : 'text-secondary hover:text-brand'
            }`}
    >
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-6 w-6' })}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

// Icons
import { ArrowRight as ArrowRightIcon, Settings as SettingsIcon } from 'lucide-react';

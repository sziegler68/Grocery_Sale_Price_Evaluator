import React, { useState, useEffect } from 'react';
import { ShoppingCart, List, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import { getStoredShareCodes } from '../../../shared/utils/shoppingListStorage';
import { getShoppingListsByCodes, getItemsForList } from '../../shopping-lists/api';
import { PriceCheckModal } from '../../price-tracker/components/PriceCheckModal';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const userName = JSON.parse(localStorage.getItem('userProfile') || '{}').name || 'Shopper';

    // Load real shopping lists
    const [recentLists, setRecentLists] = useState<Array<{ id: string; name: string; itemCount: number; sharedWith: string[] }>>([]);
    const [showPriceCheck, setShowPriceCheck] = useState(false);

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

    return (
        <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
                {/* Welcome Header */}
                <section className="bg-card rounded-2xl p-6 shadow-lg border border-primary">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Welcome back, {userName}!</h1>
                        <p className="text-secondary mt-1">Ready to find the best deals?</p>
                    </div>
                </section>

                {/* Main Actions */}
                <section className="grid grid-cols-3 gap-3">
                    {/* Make a List */}
                    <button
                        onClick={() => navigate('/shopping-lists')}
                        className="p-3 rounded-xl bg-purple-600 shadow-md shadow-purple-900/20 hover:bg-purple-700 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center gap-2 group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                            <List className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white text-xs sm:text-sm">Make List</h3>
                        </div>
                    </button>

                    {/* Price Check */}
                    <button
                        onClick={() => setShowPriceCheck(true)}
                        className="p-3 rounded-xl bg-purple-600 shadow-md shadow-purple-900/20 hover:bg-purple-700 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center gap-2 group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                            <Search className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white text-xs sm:text-sm">Price Check</h3>
                        </div>
                    </button>

                    {/* Shopping Trip */}
                    <button
                        onClick={() => navigate('/active-trip')}
                        className="p-3 rounded-xl bg-purple-600 shadow-md shadow-purple-900/20 hover:bg-purple-700 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center gap-2 group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white text-xs sm:text-sm">Trip</h3>
                        </div>
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
                            Create New List
                        </button>
                    </div>
                </section>
            </main>

            <Footer />

            <PriceCheckModal
                isOpen={showPriceCheck}
                onClose={() => setShowPriceCheck(false)}
                darkMode={darkMode}
            />
        </div >
    );
};

// Icons
import { ArrowRight as ArrowRightIcon } from 'lucide-react';

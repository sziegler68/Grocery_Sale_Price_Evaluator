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
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Make a List */}
                    <button
                        onClick={() => navigate('/shopping-lists')}
                        className="relative overflow-hidden p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/10 shadow-sm hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center gap-4 group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>

                        <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:rotate-6 transition-transform duration-300 shadow-inner">
                            <List className="h-7 w-7" />
                        </div>
                        <div className="text-center relative z-10">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Make a List</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new shopping list</p>
                        </div>
                    </button>

                    {/* Price Check */}
                    <button
                        onClick={() => setShowPriceCheck(true)}
                        className="relative overflow-hidden p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/10 shadow-sm hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center gap-4 group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>

                        <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:rotate-6 transition-transform duration-300 shadow-inner">
                            <Search className="h-7 w-7" />
                        </div>
                        <div className="text-center relative z-10">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Price Check</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Scan or search for prices</p>
                        </div>
                    </button>

                    {/* Shopping Trip */}
                    <button
                        onClick={() => navigate('/active-trip')}
                        className="relative overflow-hidden p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/10 shadow-sm hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center gap-4 group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>

                        <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:rotate-6 transition-transform duration-300 shadow-inner">
                            <ShoppingCart className="h-7 w-7" />
                        </div>
                        <div className="text-center relative z-10">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Shopping Trip</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start or resume a trip</p>
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
        </div>
    );
};

// Icons
import { ArrowRight as ArrowRightIcon } from 'lucide-react';

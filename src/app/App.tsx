import React, { useEffect } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { Dashboard } from '../features/dashboard/components/Dashboard';
import AddItem from '@features/price-tracker/components/AddItem';
import EditItem from '@features/price-tracker/components/EditItem';
import Items from '@features/price-tracker/components/Items';
import ItemDetail from '@features/price-tracker/components/ItemDetail';
import Analytics from '@shared/components/Analytics';
import Settings from '@shared/components/Settings';
import ShoppingLists from '@features/shopping-lists/components/ShoppingLists';
import ShoppingListDetail from '@features/shopping-lists/components/ShoppingListDetail';
import Help from '@shared/components/Help';
import NotFound from '@shared/components/NotFound';
import { OnboardingWizard } from '../features/onboarding/components/OnboardingWizard';
import StandaloneScanner from '@features/price-tracker/components/StandaloneScanner';

declare const __APP_NAME__: string;

const App: React.FC = () => {
  console.log('🚀 Grocery App Started - Version 1.0');
  console.log('📝 Debug Mode: ENABLED');
  console.log('🔍 Check console for [NOTIF] and [CHECKBOX] logs');

  useEffect(() => {
    if (__APP_NAME__) {
      document.title = `${__APP_NAME__} - LunaCart Preview`;
    }
  }, []);

  const [showOnboarding, setShowOnboarding] = React.useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  if (showOnboarding) {
    return (
      <Theme appearance="inherit" radius="large" scaling="100%">
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
        <ToastContainer position="top-right" autoClose={3000} />
      </Theme>
    );
  }

  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <Router>
        <main className="min-h-screen font-inter">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-item" element={<AddItem />} />
            <Route path="/edit-item/:id" element={<EditItem />} />
            <Route path="/items" element={<Items />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/shopping-lists" element={<ShoppingLists />} />
            <Route path="/shopping-lists/:shareCode" element={<ShoppingListDetail />} />
            <Route path="/scan" element={<StandaloneScanner />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </main>
      </Router>
    </Theme>
  );
}

export default App;
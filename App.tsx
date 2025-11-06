import React, { useEffect } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './Home';
import AddItem from './AddItem';
import EditItem from './EditItem';
import Items from './Items';
import ItemDetail from './ItemDetail';
import Analytics from './Analytics';
import Settings from './Settings';
import ShoppingLists from './ShoppingLists';
import ShoppingListDetail from './ShoppingListDetail';
import Help from './Help';
import NotFound from './NotFound';

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

  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <Router>
        <main className="min-h-screen font-inter">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add-item" element={<AddItem />} />
            <Route path="/edit-item/:id" element={<EditItem />} />
            <Route path="/items" element={<Items />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/shopping-lists" element={<ShoppingLists />} />
            <Route path="/shopping-list/:shareCode" element={<ShoppingListDetail />} />
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
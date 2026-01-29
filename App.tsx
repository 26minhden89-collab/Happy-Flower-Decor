import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Materials } from './pages/Materials';
import { Orders } from './pages/Orders';
import { Finance } from './pages/Finance';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'materials': return <Materials />;
      case 'orders': return <Orders />;
      case 'finance': return <Finance />;
      default: return <Dashboard />;
    }
  };

  return (
    <DataProvider>
      <div className="flex min-h-screen bg-orange-50 text-slate-900 font-sans">
        <Sidebar 
          currentTab={currentTab} 
          onTabChange={setCurrentTab} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center h-16 px-4 bg-white border-b border-orange-100">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-slate-600">
              <Menu size={24} />
            </button>
            <span className="ml-2 font-bold text-lg text-primary">HAPPY FLOWER DECOR</span>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </DataProvider>
  );
};

export default App;
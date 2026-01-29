import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Layers, DollarSign, Menu, X } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, isMobileOpen, setIsMobileOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Đơn hàng', icon: <ShoppingCart size={20} /> },
    { id: 'products', label: 'Sản phẩm', icon: <Package size={20} /> },
    { id: 'materials', label: 'Kho vật liệu', icon: <Layers size={20} /> },
    { id: 'finance', label: 'Thu chi', icon: <DollarSign size={20} /> },
  ];

  const sidebarClasses = `fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-orange-100 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen ${
    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-orange-100">
          <span className="text-xl font-bold text-primary">HAPPY FLOWER DECOR</span>
          <button className="md:hidden" onClick={() => setIsMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileOpen(false);
              }}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                currentTab === item.id 
                  ? 'bg-orange-100 text-primary shadow-sm' 
                  : 'text-slate-600 hover:bg-orange-50 hover:text-primary'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
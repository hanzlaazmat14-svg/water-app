import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Clock,
  CalendarDays,
  User,
  Truck,
  LayoutDashboard,
  ShoppingBag
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { role } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const pathname = location.pathname;

  // Driver View: STRICT ISOLATION (zero customer links)
  if (role === 'driver' || pathname.startsWith('/driver')) {
    const driverItems = [
      { to: '/driver', label: 'Deliveries', icon: Truck },
      { to: '/driver/profile', label: 'Driver Profile', icon: User },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe md:hidden shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
          {driverItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
                  isActive
                    ? 'text-cyan-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-700 rounded-full" />
                  )}
                </div>
                <span className="text-[11px] mt-1 font-semibold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Admin View
  if (role === 'admin' || pathname.startsWith('/admin')) {
    const adminItems = [
      { to: '/admin', label: 'Command', icon: LayoutDashboard },
      { to: '/driver', label: 'Driver View', icon: Truck },
      { to: '/', label: 'Storefront', icon: Home },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 text-white border-t border-slate-800 pb-safe md:hidden shadow-xl">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
                  isActive
                    ? 'text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Customer View: 5-Tab E-Commerce layout (Daraz / Amazon / Nestlé Pure Life style)
  const customerItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/subscriptions', label: 'Plans', icon: CalendarDays },
    { to: '/orders', label: 'Orders', icon: Clock },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe md:hidden shadow-lg">
      <div className="flex items-center justify-between h-16 max-w-lg mx-auto px-1">
        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            pathname === '/' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${pathname === '/' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pathname === '/' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
        </Link>

        {/* Plans / Subscriptions (Screenshot 4) */}
        <Link
          to="/subscriptions"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            pathname === '/subscriptions' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <CalendarDays className={`w-5 h-5 ${pathname === '/subscriptions' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pathname === '/subscriptions' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Plans</span>
        </Link>

        {/* Orders (Screenshot 5) */}
        <Link
          to="/orders"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            pathname === '/orders' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <Clock className={`w-5 h-5 ${pathname === '/orders' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pathname === '/orders' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Orders</span>
        </Link>

        {/* Cart Drawer Trigger (Daraz / Amazon style with badge) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 text-slate-500 hover:text-cyan-600 font-medium relative group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-50 group-hover:bg-cyan-100 transition-colors">
              <ShoppingBag className="w-4 h-4 text-cyan-700 stroke-[2.2]" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold text-slate-700">Cart</span>
        </button>

        {/* Account / Profile (Location map & PWA installer) */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95 ${
            pathname === '/profile' ? 'text-cyan-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 ${pathname === '/profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pathname === '/profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Account</span>
        </Link>
      </div>
    </nav>
  );
};

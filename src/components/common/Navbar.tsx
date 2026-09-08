import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { businessConfig } from '../../config/business';
import { getWhatsAppUrl } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  LogOut,
  ShieldCheck,
  Truck,
  UserCheck,
  Droplet
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, role, signOut } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const handleSupportWhatsApp = () => {
    const url = getWhatsAppUrl(
      businessConfig.whatsappNumber,
      `Hello ${businessConfig.companyName}, I have a question regarding my water delivery.`
    );
    window.open(url, '_blank');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 p-2 shadow-sm flex items-center justify-center text-white">
            <img src={businessConfig.logoUrl} alt={businessConfig.companyName} className="w-full h-full object-contain filter brightness-0 invert" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                {businessConfig.companyName}
              </span>
              {role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
              {role === 'driver' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <Truck className="w-3 h-3" /> Driver
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
              {businessConfig.slogan}
            </p>
          </div>
        </Link>

        {/* Portal Switching Links (Desktop & Mobile Pills) */}
        {role === 'driver' ? (
          <nav className="hidden md:flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-2xl text-xs font-bold text-blue-800 border border-blue-100">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Driver Delivery Mode</span>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                pathname === '/' || pathname.startsWith('/customer') || pathname === '/orders' || pathname === '/subscriptions'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer App
            </Link>
            <Link
              to="/driver"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                pathname.startsWith('/driver')
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Driver Portal
            </Link>
            {role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  pathname === '/admin'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Owner Dashboard
              </Link>
            )}
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WhatsApp Support Button */}
          <button
            onClick={handleSupportWhatsApp}
            title="Chat with WhatsApp Support"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
            <span className="hidden lg:inline">WhatsApp</span>
          </button>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={role === 'driver' ? '/driver/profile' : role === 'admin' ? '/admin' : '/profile'}
                className="text-right hidden sm:block hover:opacity-80 transition-opacity"
                title="View Profile"
              >
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {profile?.phone || user.email}
                </p>
              </Link>

              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

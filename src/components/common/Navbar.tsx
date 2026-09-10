import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { getWhatsAppUrl } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  LogOut,
  ShieldCheck,
  Truck,
  User,
  UserCheck,
  Droplet
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, role, signOut } = useAuth();
  const { settings } = useBusiness();
  const location = useLocation();
  const pathname = location.pathname;

  const handleSupportWhatsApp = () => {
    const url = getWhatsAppUrl(
      settings.whatsappNumber,
      `Hello ${settings.companyName}, I have a question regarding my water delivery.`
    );
    window.open(url, '_blank');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/70 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-3">
        {/* Brand Logo & Name (Sleek, Compact, Smart) */}
        <Link to="/" className="flex items-center gap-2.5 select-none group min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 p-1 shadow-2xs flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.companyName}
                className={`w-full h-full object-contain ${
                  settings.logoUrl === '/logo.svg' ? 'filter brightness-0 invert' : ''
                }`}
                onError={(e) => {
                  // Fallback to Droplet icon if custom logo image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Droplet className="w-4 h-4 fill-white" />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base truncate group-hover:text-brand-600 transition-colors">
              {settings.companyName}
            </span>

            {role === 'admin' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
            {role === 'driver' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <Truck className="w-3 h-3" /> Driver
              </span>
            )}
          </div>
        </Link>

        {/* Center / Role Quick Action */}
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <Link
              to={pathname === '/admin' ? '/' : '/admin'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{pathname === '/admin' ? 'Storefront' : 'Owner Portal'}</span>
            </Link>
          )}

          {role === 'driver' && (
            <Link
              to="/driver"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
            >
              <Truck className="w-3 h-3" />
              <span>Driver Stops</span>
            </Link>
          )}
        </div>

        {/* Right Action Controls (Ultra Sleek) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* WhatsApp Support Button */}
          <button
            onClick={handleSupportWhatsApp}
            title={`Chat with ${settings.companyName} on WhatsApp`}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-2xs"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 shrink-0" />
            <span className="hidden md:inline">WhatsApp</span>
          </button>

          {/* User Account / Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1 border-l border-slate-200">
              <Link
                to={role === 'driver' ? '/driver/profile' : role === 'admin' ? '/admin' : '/profile'}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                title="View Profile"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                  {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[100px] truncate">
                  {profile?.full_name?.split(' ')[0] || 'Account'}
                </span>
              </Link>

              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};


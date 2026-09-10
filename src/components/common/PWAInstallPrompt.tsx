import React from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useBusiness } from '../../context/BusinessContext';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, promptInstall, dismissPrompt } = usePWAInstall();
  const { settings } = useBusiness();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slide-up">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-float border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img
              src={settings.logoUrl || '/logo.svg'}
              alt={settings.companyName}
              className={`w-full h-full object-contain ${
                settings.logoUrl === '/logo.svg' || !settings.logoUrl ? 'filter brightness-0 invert' : ''
              }`}
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm leading-tight text-white">
              Install {settings.shortName || settings.companyName} App
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Add to Home Screen for faster 1-tap refills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={dismissPrompt}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

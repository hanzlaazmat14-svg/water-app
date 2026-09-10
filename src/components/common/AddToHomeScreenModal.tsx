import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { businessConfig } from '../../config/business';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  MoreVertical,
  X,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddToHomeScreenModal: React.FC<AddToHomeScreenModalProps> = ({ isOpen, onClose }) => {
  const { canPromptDirectly, promptInstall, isIOS, isStandalone } = usePWAInstall();
  const { settings } = useBusiness();

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const success = await promptInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-5 animate-slide-up relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Logo & Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 p-2.5 shadow-elevated flex items-center justify-center text-white mx-auto overflow-hidden">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.companyName}
                className={`w-full h-full object-contain ${
                  settings.logoUrl === '/logo.svg' ? 'filter brightness-0 invert' : ''
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Sparkles className="w-7 h-7 text-white" />
            )}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Install {settings.shortName || settings.companyName} App
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enjoy instant 1-tap water refill orders, order tracking, and offline support on your home screen.
          </p>
        </div>

        {isStandalone ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              The app is already installed and running on your device!
            </span>
          </div>
        ) : canPromptDirectly ? (
          /* Direct Native Install Button (Chrome, Edge, Android) */
          <div className="space-y-3">
            <button
              onClick={handleDirectInstall}
              className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Install to Home Screen Now</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              No App Store download required • 100% Free
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Step-by-Step Instructions */
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Instructions for iPhone & iPad (Safari):
            </span>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-slate-800">Share button</strong> (
                  <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-brand-600" />) at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down the menu and select <strong className="text-slate-800">"Add to Home Screen"</strong> (
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-brand-600" />).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong className="text-slate-800">"Add"</strong> at the top right corner.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Desktop Chrome & Edge Instructions */
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              How to add to Home Screen on your browser:
            </span>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-slate-800">menu button</strong> (
                  <MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-brand-600" />) at the top right corner of Chrome/Edge.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Select <strong className="text-slate-800">"Install app"</strong> or <strong className="text-slate-800">"Add to Home screen"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Confirm install. The {businessConfig.shortName} icon will appear directly on your home screen!
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

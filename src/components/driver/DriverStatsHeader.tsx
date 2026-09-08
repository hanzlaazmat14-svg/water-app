import React from 'react';
import { Route, CheckCircle2, Clock, AlertOctagon } from 'lucide-react';

interface DriverStatsHeaderProps {
  total: number;
  completed: number;
  remaining: number;
  failed: number;
  onOptimizeRoute: () => void;
  isOptimizing?: boolean;
}

export const DriverStatsHeader: React.FC<DriverStatsHeaderProps> = ({
  total,
  completed,
  remaining,
  failed,
  onOptimizeRoute,
  isOptimizing,
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Driver Dispatch Mode
          </span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            Today's Route
          </h2>
        </div>

        <button
          onClick={onOptimizeRoute}
          disabled={isOptimizing || total <= 1}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Route className="w-4 h-4" />
          <span>{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <div className="bg-slate-800/80 rounded-2xl p-2.5 text-center border border-slate-700/50">
          <span className="text-[10px] font-semibold text-slate-400 block">Total</span>
          <span className="text-lg font-extrabold text-white font-mono">{total}</span>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-2.5 text-center border border-emerald-900/50">
          <span className="text-[10px] font-semibold text-emerald-400 block">Done</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">{completed}</span>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-2.5 text-center border border-sky-900/50">
          <span className="text-[10px] font-semibold text-sky-400 block">Pending</span>
          <span className="text-lg font-extrabold text-sky-400 font-mono">{remaining}</span>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-2.5 text-center border border-rose-900/50">
          <span className="text-[10px] font-semibold text-rose-400 block">Failed</span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">{failed}</span>
        </div>
      </div>
    </div>
  );
};

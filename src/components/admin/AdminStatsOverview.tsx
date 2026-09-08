import React from 'react';
import { formatCurrency } from '../../lib/utils';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Banknote,
  Users,
  Repeat
} from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    totalOrdersToday: number;
    pendingOrders: number;
    assignedOrders: number;
    outForDelivery: number;
    deliveredToday: number;
    failedToday: number;
    codExpected: number;
    codCollected: number;
    activeCustomersCount: number;
    activeSubscriptionsCount: number;
  };
}

export const AdminStatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="space-y-4">
      {/* Primary Financial & Volume Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Orders
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-brand-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalOrdersToday}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              {stats.pendingOrders} pending assignment
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              COD Expected
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(stats.codExpected)}
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              Collected: {formatCurrency(stats.codCollected)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Delivered Today
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
              {stats.deliveredToday}
            </span>
            <p className="text-xs text-rose-500 font-semibold mt-0.5">
              {stats.failedToday} failed / cancelled
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Recurring
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.activeSubscriptionsCount}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Across {stats.activeCustomersCount} registered customers
            </p>
          </div>
        </div>
      </div>

      {/* Operational Dispatch Status Badges */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-300">Live Delivery Pipeline:</span>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-300">Pending:</span>
            <span className="font-bold text-white font-mono">{stats.pendingOrders}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Assigned:</span>
            <span className="font-bold text-white font-mono">{stats.assignedOrders}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-slate-300">Out on Road:</span>
            <span className="font-bold text-white font-mono">{stats.outForDelivery}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Completed:</span>
            <span className="font-bold text-white font-mono">{stats.deliveredToday}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

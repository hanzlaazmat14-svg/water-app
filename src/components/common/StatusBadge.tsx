import React from 'react';
import { OrderStatus } from '../../lib/database.types';
import { getOrderStatusMeta } from '../../lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const meta = getOrderStatusMeta(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${meta.badgeClass} ${sizeClasses[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'out_for_delivery'
            ? 'bg-blue-600 animate-ping'
            : status === 'delivered'
            ? 'bg-emerald-600'
            : status === 'failed'
            ? 'bg-rose-600'
            : status === 'cancelled'
            ? 'bg-slate-400'
            : 'bg-amber-500'
        }`}
      />
      {meta.label}
    </span>
  );
};

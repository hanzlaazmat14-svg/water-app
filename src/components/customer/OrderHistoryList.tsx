import React from 'react';
import { Order } from '../../lib/database.types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { StatusBadge } from '../common/StatusBadge';
import { RotateCcw, Package, ChevronRight } from 'lucide-react';

interface OrderHistoryListProps {
  orders: Order[];
  onOrderAgain: (productId?: string) => void;
  onViewDetails?: (order: Order) => void;
}

export const OrderHistoryList: React.FC<OrderHistoryListProps> = ({
  orders,
  onOrderAgain,
  onViewDetails,
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-brand-600 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-base">No previous orders yet</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Your past refill deliveries and details will appear here after you place your first order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const firstItem = order.order_items?.[0];
        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle hover:border-slate-300 transition-all flex items-center justify-between gap-3"
          >
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onViewDetails?.(order)}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-700">
                  #{order.order_number}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  {formatDate(order.delivery_date)}
                </span>
                <StatusBadge status={order.status} size="sm" />
              </div>

              <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                {firstItem ? `${firstItem.product_name} (${firstItem.quantity}x)` : 'Water Refill'}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-extrabold text-brand-700">
                  {formatCurrency(order.total_amount)}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({order.payment_status === 'paid' ? 'Paid' : 'Cash on Delivery'})
                </span>
              </div>
            </div>

            <button
              onClick={() => onOrderAgain(firstItem?.product_id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-brand-700 font-bold text-xs rounded-xl transition-colors shrink-0 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Order Again</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

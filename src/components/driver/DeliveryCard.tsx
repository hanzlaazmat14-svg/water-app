import React, { useState } from 'react';
import { Order } from '../../lib/database.types';
import {
  formatCurrency,
  getPhoneUrl,
  getWhatsAppUrl,
  getDirectionsUrl
} from '../../lib/utils';
import { StatusBadge } from '../common/StatusBadge';
import { CompleteDeliveryModal } from './CompleteDeliveryModal';
import { FailDeliveryModal } from './FailDeliveryModal';
import {
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Droplet
} from 'lucide-react';

interface DeliveryCardProps {
  order: Order;
  stopNumber: number;
  onOrderUpdated: () => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  order,
  stopNumber,
  onOrderUpdated,
}) => {
  const [isCompleteOpen, setIsCompleteOpen] = useState<boolean>(false);
  const [isFailOpen, setIsFailOpen] = useState<boolean>(false);

  const customerPhone = order.customer?.phone || '';
  const customerName = order.customer?.full_name || 'Customer';
  const firstItem = order.order_items?.[0];
  const isDelivered = order.status === 'delivered';
  const isFailed = order.status === 'failed';
  const isPending = !isDelivered && !isFailed;

  const handleNavigate = () => {
    const url = getDirectionsUrl(
      order.delivery_latitude,
      order.delivery_longitude,
      order.delivery_address
    );
    window.open(url, '_blank');
  };

  return (
    <>
      <div
        className={`bg-white rounded-3xl p-5 border shadow-card transition-all space-y-4 ${
          isDelivered
            ? 'border-emerald-200 bg-emerald-50/20'
            : isFailed
            ? 'border-rose-200 bg-rose-50/20 opacity-80'
            : 'border-slate-200 hover:border-brand-300'
        }`}
      >
        {/* Header: Stop Number & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center font-mono">
              #{stopNumber}
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800">
                Order #{order.order_number}
              </span>
              {order.delivery_slot && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-brand-600" />
                  <span>{order.delivery_slot.name}</span>
                </div>
              )}
            </div>
          </div>

          <StatusBadge status={order.status} size="sm" />
        </div>

        {/* Customer & Address Details */}
        <div className="space-y-1.5">
          <h4 className="font-extrabold text-slate-900 text-base">
            {customerName}
          </h4>

          <div className="flex items-start gap-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{order.delivery_address}</span>
          </div>

          {order.delivery_instructions && (
            <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 italic">
              Note: {order.delivery_instructions}
            </div>
          )}
        </div>

        {/* Bottles & Cash Info */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <Droplet className="w-4 h-4 fill-sky-700" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">
                {firstItem ? `${firstItem.product_name} (${firstItem.quantity}x)` : 'Water Refill'}
              </span>
              <span className="text-[10px] text-slate-400">
                {order.order_items?.length || 1} item(s)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">Collect Cash</span>
            <span className="font-extrabold text-sm text-emerald-700 font-mono">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* Navigation Button */}
          <button
            onClick={handleNavigate}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>NAVIGATE</span>
          </button>

          {/* Call Customer */}
          {customerPhone && (
            <a
              href={getPhoneUrl(customerPhone)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-brand-600 hover:bg-slate-50 transition-colors"
              title="Call Customer"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}

          {/* WhatsApp Customer */}
          {customerPhone && (
            <a
              href={getWhatsAppUrl(customerPhone, `As-salamu alaykum, I am your water delivery hero with your order #${order.order_number}.`)}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              title="WhatsApp Customer"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}

          {/* Status Actions */}
          {isPending && (
            <>
              <button
                onClick={() => setIsCompleteOpen(true)}
                className="flex items-center gap-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>

              <button
                onClick={() => setIsFailOpen(true)}
                className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                title="Report Delivery Failure"
              >
                <AlertOctagon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Failed Reason Banner */}
        {isFailed && order.failure_reason && (
          <div className="p-2.5 rounded-xl bg-rose-100/70 text-rose-800 text-xs font-medium">
            Failed: {order.failure_reason}
          </div>
        )}

        {/* Delivered Confirmation Banner */}
        {isDelivered && (
          <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Delivered • {order.bottles_delivered || 1} bottle(s) handed over</span>
          </div>
        )}
      </div>

      <CompleteDeliveryModal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        order={order}
        onSuccess={onOrderUpdated}
      />

      <FailDeliveryModal
        isOpen={isFailOpen}
        onClose={() => setIsFailOpen(false)}
        order={order}
        onSuccess={onOrderUpdated}
      />
    </>
  );
};

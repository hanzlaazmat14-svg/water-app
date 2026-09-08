import React from 'react';
import { Order } from '../../lib/database.types';
import { formatCurrency, formatDate, getOrderStatusMeta, getWhatsAppUrl, getPhoneUrl } from '../../lib/utils';
import { businessConfig } from '../../config/business';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  CheckCircle2,
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  AlertTriangle,
  Headphones,
  Sparkles
} from 'lucide-react';

interface ActiveOrderTrackerProps {
  order: Order;
  onOrderUpdated: () => void;
}

export const ActiveOrderTracker: React.FC<ActiveOrderTrackerProps> = ({ order, onOrderUpdated }) => {
  const { showToast } = useToast();
  const meta = getOrderStatusMeta(order.status);

  // 4-stage tracking stages matching Reference Screenshot 5
  const stages = [
    {
      step: 1,
      title: 'Your order has been accepted.',
      desc: 'Order confirmed and registered in our delivery queue.',
      statusKey: 'pending',
    },
    {
      step: 2,
      title: 'Your order is being prepared.',
      desc: 'Your refill containers are sanitized, mineral tested, and sealed.',
      statusKey: 'confirmed',
    },
    {
      step: 3,
      title: 'Your order has been picked up.',
      desc: 'Stay hydrated, your bottles are loaded onto the delivery vehicle!',
      statusKey: 'assigned',
    },
    {
      step: 4,
      title: 'Your order is arriving soon!',
      desc: 'Hydration is just a few minutes away, your driver is nearing your gate!',
      statusKey: 'out_for_delivery',
    },
  ];

  const handleCancel = async () => {
    if (order.status !== 'pending') return;
    const confirm = window.confirm('Are you sure you want to cancel this refill order?');
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;
      showToast('Order cancelled successfully.', 'info');
      onOrderUpdated();
    } catch (err: any) {
      console.error('Cancel order error:', err);
      showToast(err.message || 'Failed to cancel order.', 'error');
    }
  };

  const handleContactSupport = () => {
    const url = getWhatsAppUrl(
      businessConfig.whatsappNumber,
      `Hello ${businessConfig.companyName}, I have a question about my active order #${order.order_number}.`
    );
    window.open(url, '_blank');
  };

  // Determine stage progress level (1 to 4)
  const currentStageIndex =
    order.status === 'out_for_delivery'
      ? 4
      : order.status === 'assigned'
      ? 3
      : order.status === 'confirmed'
      ? 2
      : order.status === 'delivered'
      ? 5
      : 1;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-5 animate-slide-up">
      {/* Order ID & Delivery Header (Reference 5) */}
      <div className="space-y-1.5 pb-4 border-b border-slate-100">
        <span className="text-[11px] font-mono font-bold text-brand-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 inline-block">
          #{order.order_number} will be delivered by {businessConfig.shortName}:
        </span>

        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
          {formatDate(order.delivery_date)}
        </h3>

        {order.delivery_slot && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span>{order.delivery_slot.name}</span>
          </div>
        )}

        <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1">
          <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
          <span className="font-medium line-clamp-1">{order.delivery_address}</span>
        </div>
      </div>

      {/* VERTICAL CONNECTED 4-STAGE TIMELINE (Screenshot 5) */}
      <div className="relative pl-6 space-y-6">
        {/* Connecting Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-3 w-0.5 bg-slate-200" />
        <div
          className="absolute left-[11px] top-2 w-0.5 bg-brand-600 transition-all duration-500"
          style={{
            height: `${Math.min(100, Math.max(0, ((currentStageIndex - 1) / 3) * 100))}%`,
          }}
        />

        {stages.map((stage) => {
          const isDone = currentStageIndex > stage.step;
          const isCurrent = currentStageIndex === stage.step;
          const isPending = currentStageIndex < stage.step;

          return (
            <div key={stage.step} className="relative flex items-start gap-3">
              {/* Timeline Dot Node */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-brand-600 text-white shadow-sm ring-4 ring-sky-50'
                    : isCurrent
                    ? 'bg-brand-600 text-white shadow-sm ring-4 ring-sky-100 animate-pulse-subtle'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span>{stage.step}</span>
                )}
              </div>

              {/* Stage Content */}
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-extrabold leading-tight ${
                    isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {stage.title}
                </p>
                <p
                  className={`text-[11px] mt-0.5 leading-normal ${
                    isCurrent ? 'text-brand-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Assigned Card (if active) */}
      {order.driver && (
        <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                Assigned Delivery Rider
              </span>
              <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                {order.driver.full_name || 'Rider On Duty'}
              </p>
            </div>
          </div>

          {order.driver.phone && (
            <div className="flex items-center gap-1.5">
              <a
                href={getPhoneUrl(order.driver.phone)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 hover:bg-slate-50 shadow-2xs transition-colors"
                title="Call Rider"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={getWhatsAppUrl(order.driver.phone, `Salam! I am checking on my water delivery #${order.order_number}.`)}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                title="WhatsApp Rider"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* NEED SUPPORT? CONTACT US CARD (Reference 5) */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-2 text-slate-800">
          <Headphones className="w-4 h-4 text-brand-600" />
          <h4 className="font-extrabold text-xs">Need support?</h4>
        </div>
        <p className="text-[11px] text-slate-500">
          Do you have questions about your delivery address, timing, or bottles?
        </p>
        <button
          onClick={handleContactSupport}
          className="w-full py-2.5 px-4 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold text-xs shadow-subtle transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Contact Us via WhatsApp</span>
        </button>
      </div>

      {/* Pending Cancel Option */}
      {order.status === 'pending' && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={handleCancel}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cancel Refill Request</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Subscription } from '../../lib/database.types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { SkipDeliveryModal } from './SkipDeliveryModal';
import {
  CalendarDays,
  Pause,
  Play,
  CalendarOff,
  Trash2,
  Clock,
  Droplet
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdated: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onUpdated }) => {
  const { showToast } = useToast();
  const [isSkipOpen, setIsSkipOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'daily':
        return 'Daily';
      case 'every_2_days':
        return 'Every 2 Days';
      case 'every_3_days':
        return 'Every 3 Days';
      case 'weekly':
        return 'Weekly';
      default:
        return freq;
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = subscription.status === 'active' ? 'paused' : 'active';
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
      showToast(
        newStatus === 'active'
          ? 'Subscription resumed! Regular deliveries are on.'
          : 'Subscription paused. No new orders will be generated.',
        'info'
      );
      onUpdated();
    } catch (err: any) {
      console.error('Toggle subscription error:', err);
      showToast(err.message || 'Failed to update subscription.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    const confirm = window.confirm('Are you sure you want to cancel this recurring delivery plan?');
    if (!confirm) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
      showToast('Recurring plan cancelled.', 'info');
      onUpdated();
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
      showToast(err.message || 'Failed to cancel subscription.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const isPaused = subscription.status === 'paused';

  return (
    <>
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPaused ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-600'}`}>
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {subscription.product?.name || 'Water Refill'}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isPaused
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isPaused ? 'Paused' : 'Active Plan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {subscription.quantity} bottle(s) • {formatFrequency(subscription.frequency)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">Unit</span>
            <span className="text-sm font-extrabold text-brand-700">
              {formatCurrency(subscription.product?.price)}
            </span>
          </div>
        </div>

        {/* Next Delivery Banner */}
        <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarDays className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Next Delivery Date:</span>
          </div>
          <span className="font-bold text-slate-900">
            {isPaused ? 'On hold (Paused)' : formatDate(subscription.next_delivery_date)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                isPaused
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume Plan' : 'Pause Plan'}</span>
            </button>

            <button
              onClick={() => setIsSkipOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-colors"
            >
              <CalendarOff className="w-3.5 h-3.5" />
              <span>Skip Dates</span>
            </button>
          </div>

          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Cancel Recurring Plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SkipDeliveryModal
        isOpen={isSkipOpen}
        onClose={() => setIsSkipOpen(false)}
        subscription={subscription}
        onSuccess={onUpdated}
      />
    </>
  );
};

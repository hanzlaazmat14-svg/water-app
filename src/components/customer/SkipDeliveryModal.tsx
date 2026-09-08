import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Subscription } from '../../lib/database.types';
import { X, CalendarOff, Loader2, AlertCircle } from 'lucide-react';

interface SkipDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuccess: () => void;
}

export const SkipDeliveryModal: React.FC<SkipDeliveryModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(nextWeekStr);
  const [reason, setReason] = useState<string>('Out of town / Traveling');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!startDate || !endDate) {
      setErrorMsg('Please select start and end dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.from('subscription_skips').insert({
        subscription_id: subscription.id,
        customer_id: user.id,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || null,
      });

      if (error) throw error;

      showToast('Delivery skipped successfully. No deliveries will arrive during these dates.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Skip delivery error:', err);
      setErrorMsg(err.message || 'Failed to record skip interval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Skip Upcoming Deliveries
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Traveling or away? Pause without cancelling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Skip From Date
              </label>
              <input
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Skip To Date (Inclusive)
              </label>
              <input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Reason (Optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="Out of town / Traveling">Out of town / Traveling</option>
              <option value="Already have sufficient water">Already have sufficient water</option>
              <option value="Home renovation / relocation">Home renovation / relocation</option>
              <option value="Other">Other reason</option>
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs leading-relaxed">
            💡 Deliveries will automatically resume after <strong>{endDate}</strong>. You don't need to call or WhatsApp us!
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Skip Interval'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order } from '../../lib/database.types';
import { X, AlertOctagon, Loader2, AlertCircle } from 'lucide-react';

interface FailDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export const FailDeliveryModal: React.FC<FailDeliveryModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState<string>('Customer unavailable');
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const fullReason = reason === 'Other' && customNote.trim() ? `Other: ${customNote.trim()}` : reason;

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'failed',
          failure_reason: fullReason,
          driver_notes: customNote.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      await supabase.from('delivery_status_history').insert({
        order_id: order.id,
        status: 'failed',
        notes: `Delivery failed. Reason: ${fullReason}`,
        changed_by: user?.id,
      });

      showToast(`Order #${order.order_number} marked as Failed.`, 'info');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed delivery update error:', err);
      setErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Report Delivery Failure
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Order #{order.order_number} • {order.customer?.full_name}
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
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Reason for Non-Delivery
            </label>
            <div className="space-y-2">
              {[
                'Customer unavailable',
                'Wrong address / Location unreachable',
                'Customer cancelled upon arrival',
                'No response at gate/door or phone',
                'Other',
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                    reason === r
                      ? 'border-rose-500 bg-rose-50/60 text-rose-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="failure-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {(reason === 'Other' || reason === 'Customer unavailable') && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Additional Details
              </label>
              <textarea
                rows={2}
                placeholder="Provide brief details for the manager..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                required={reason === 'Other'}
              />
            </div>
          )}

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
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Submit Non-Delivery Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

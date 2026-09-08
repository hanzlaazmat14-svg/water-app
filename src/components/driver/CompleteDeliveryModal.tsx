import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order } from '../../lib/database.types';
import { formatCurrency } from '../../lib/utils';
import { X, CheckCircle2, Loader2, AlertCircle, Plus, Minus } from 'lucide-react';

interface CompleteDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export const CompleteDeliveryModal: React.FC<CompleteDeliveryModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const totalOrderedBottles = (order.order_items || []).reduce((sum, item) => sum + item.quantity, 0) || 1;

  const [bottlesDelivered, setBottlesDelivered] = useState<number>(totalOrderedBottles);
  const [emptyReturned, setEmptyReturned] = useState<number>(totalOrderedBottles);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          payment_status: 'paid',
          bottles_delivered: bottlesDelivered,
          empty_bottles_returned: emptyReturned,
          driver_notes: notes.trim() || null,
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Log status history
      await supabase.from('delivery_status_history').insert({
        order_id: order.id,
        status: 'delivered',
        notes: `Delivered ${bottlesDelivered} bottle(s), collected ${emptyReturned} empty bottle(s). ${notes ? `Note: ${notes}` : ''}`,
        changed_by: user?.id,
      });

      showToast(`Order #${order.order_number} marked as Delivered!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Complete delivery error:', err);
      setErrorMsg(err.message || 'Failed to complete delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Complete Delivery #{order.order_number}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Collect {formatCurrency(order.total_amount)} COD
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
          {/* Bottles Delivered */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Bottles Delivered</span>
              <span className="text-[10px] text-slate-400">Ordered: {totalOrderedBottles}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBottlesDelivered((b) => Math.max(0, b - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-bold text-base text-slate-900 font-mono">
                {bottlesDelivered}
              </span>
              <button
                type="button"
                onClick={() => setBottlesDelivered((b) => b + 1)}
                className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Empties Returned */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Empty Bottles Returned</span>
              <span className="text-[10px] text-slate-400">Bottles brought back</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setEmptyReturned((b) => Math.max(0, b - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-bold text-base text-slate-900 font-mono">
                {emptyReturned}
              </span>
              <button
                type="button"
                onClick={() => setEmptyReturned((b) => b + 1)}
                className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Driver Note */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Delivery Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Received by guard / customer cash paid"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* COD Reminder */}
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center justify-between">
            <span className="font-semibold">Cash Collected from Customer:</span>
            <span className="font-extrabold text-sm font-mono">
              {formatCurrency(order.total_amount)}
            </span>
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm Handover & Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

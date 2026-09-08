import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Order, Profile } from '../../lib/database.types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { X, Truck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(order.assigned_driver_id || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadDrivers() {
      setLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'driver')
          .eq('is_active', true);

        if (error) throw error;
        setDrivers((data || []) as Profile[]);

        if (data && data.length > 0 && !order.assigned_driver_id) {
          setSelectedDriverId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error loading drivers:', err);
        setErrorMsg('Failed to load active drivers.');
      } finally {
        setLoading(false);
      }
    }

    loadDrivers();
  }, [isOpen, order.assigned_driver_id]);

  if (!isOpen) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setErrorMsg('Please select a driver.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newStatus = order.status === 'pending' ? 'assigned' : order.status;
      const { error } = await supabase
        .from('orders')
        .update({
          assigned_driver_id: selectedDriverId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      const driverObj = drivers.find((d) => d.id === selectedDriverId);
      await supabase.from('delivery_status_history').insert({
        order_id: order.id,
        status: newStatus,
        notes: `Assigned to driver: ${driverObj?.full_name || 'Driver'}`,
        changed_by: user?.id,
      });

      showToast(`Order #${order.order_number} assigned to driver successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Assign driver error:', err);
      setErrorMsg(err.message || 'Failed to assign driver.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Assign Order #{order.order_number}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customer: {order.customer?.full_name || 'Customer'}
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

        <form onSubmit={handleAssign} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Select Active Delivery Driver
            </label>

            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>Loading available drivers...</span>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                No active drivers found. Please add a driver account in Driver Management first.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {drivers.map((d) => {
                  const isSelected = selectedDriverId === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold">
                          {d.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{d.full_name}</p>
                          <p className="text-[11px] text-slate-400">{d.phone}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Delivery Area:</span>
              <span className="font-medium text-slate-800 truncate max-w-[220px]">
                {order.delivery_address}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Slot:</span>
              <span className="font-medium text-slate-800">
                {order.delivery_slot?.name || 'Standard'}
              </span>
            </div>
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
              disabled={isSubmitting || drivers.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Driver'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

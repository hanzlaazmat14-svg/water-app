import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DeliverySlot } from '../../lib/database.types';
import { useToast } from '../../context/ToastContext';
import { Clock, Plus, Loader2, X } from 'lucide-react';

export const SlotManager: React.FC = () => {
  const { showToast } = useToast();
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // Form
  const [name, setName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [maxCapacity, setMaxCapacity] = useState<string>('50');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_slots')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSlots((data || []) as DeliverySlot[]);
    } catch (err) {
      console.error('Error loading delivery slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleToggleStatus = async (slot: DeliverySlot) => {
    try {
      const { error } = await supabase
        .from('delivery_slots')
        .update({ is_active: !slot.is_active })
        .eq('id', slot.id);

      if (error) throw error;
      showToast(`Delivery slot is now ${!slot.is_active ? 'Active' : 'Disabled'}.`, 'info');
      await loadSlots();
    } catch (err: any) {
      console.error('Toggle slot error:', err);
      showToast(err.message || 'Failed to update slot.', 'error');
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) {
      showToast('Please fill all slot fields.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('delivery_slots').insert({
        name: name.trim(),
        start_time: startTime,
        end_time: endTime,
        max_capacity: parseInt(maxCapacity, 10) || 50,
        is_active: true,
        display_order: slots.length + 1,
      });

      if (error) throw error;
      showToast(`Slot "${name}" added!`, 'success');
      setIsAddOpen(false);
      setName('');
      await loadSlots();
    } catch (err: any) {
      console.error('Add slot error:', err);
      showToast(err.message || 'Failed to add delivery slot.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Delivery Time Slots</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Available windows customers can select during checkout
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Loading slots...</span>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{slot.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {slot.start_time} – {slot.end_time} • Max {slot.max_capacity} orders/day
                    </p>
                  </div>
                </div>

                <span
                  onClick={() => handleToggleStatus(slot)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer select-none transition-colors ${
                    slot.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                  title="Click to toggle status"
                >
                  {slot.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">Add Delivery Time Slot</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Slot Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Morning (09:00 AM – 12:00 PM)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Maximum Daily Capacity</label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

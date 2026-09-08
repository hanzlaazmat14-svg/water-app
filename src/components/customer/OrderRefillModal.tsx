import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, DeliverySlot } from '../../lib/database.types';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { businessConfig } from '../../config/business';
import {
  X,
  Plus,
  Minus,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Droplet
} from 'lucide-react';

interface OrderRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
}

export const OrderRefillModal: React.FC<OrderRefillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
}) => {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoadingInitial(true);
      setErrorMsg('');
      try {
        const [prodRes, slotRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_available', true)
            .order('display_order', { ascending: true }),
          supabase
            .from('delivery_slots')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
        ]);

        if (prodRes.error) throw prodRes.error;
        if (slotRes.error) throw slotRes.error;

        const fetchedProducts = (prodRes.data || []) as Product[];
        const fetchedSlots = (slotRes.data || []) as DeliverySlot[];

        setProducts(fetchedProducts);
        setSlots(fetchedSlots);

        // Set defaults
        if (fetchedProducts.length > 0) {
          const matched = fetchedProducts.find((p) => p.id === initialProductId);
          setSelectedProductId(matched ? matched.id : fetchedProducts[0].id);
        }

        if (fetchedSlots.length > 0) {
          setSelectedSlotId(fetchedSlots[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching order options:', err);
        setErrorMsg('Failed to load products and delivery slots. Please try again.');
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [isOpen, initialProductId]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const estimatedSubtotal = selectedProduct ? selectedProduct.price * quantity : 0;
  const estimatedTotal = estimatedSubtotal; // Delivery is free or configured in business settings

  const handleDateShortcut = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDeliveryDate(d.toISOString().split('T')[0]);
  };

  const isToday = deliveryDate === new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const isTomorrow = deliveryDate === tomorrowStr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.address) {
      setErrorMsg('Please save your delivery address in your profile first.');
      return;
    }

    if (!selectedProductId || quantity <= 0 || !selectedSlotId || !deliveryDate) {
      setErrorMsg('Please complete all order selections.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Secure server-side calculation via database RPC
      const itemsPayload = [
        {
          product_id: selectedProductId,
          quantity: quantity,
        },
      ];

      const { data, error } = await supabase.rpc('create_customer_order', {
        p_items: itemsPayload,
        p_delivery_date: deliveryDate,
        p_slot_id: selectedSlotId,
        p_instructions: instructions.trim() || null,
      });

      if (error) throw error;

      showToast(`Order #${data?.order_number || ''} placed successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Order placement error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Droplet className="w-4 h-4 fill-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-none">
                Order Water Refill
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fast doorstep refill delivery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {loadingInitial ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <p className="text-xs font-medium">Loading water products & slots...</p>
            </div>
          ) : errorMsg && products.length === 0 ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <form id="refill-form" onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: Select Bottle */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  1. Select Bottle Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {products.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => setSelectedProductId(prod.id)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                          isSelected
                            ? 'border-brand-600 bg-sky-50/70 shadow-sm ring-1 ring-brand-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-extrabold text-slate-900 leading-tight">
                            {prod.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {prod.bottle_size}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-bold text-brand-700">
                          {formatCurrency(prod.price)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  2. Bottle Quantity
                </label>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Number of Bottles</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-extrabold text-lg text-slate-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 rounded-xl bg-brand-600 text-white shadow-sm flex items-center justify-center active:scale-95 transition-transform hover:bg-brand-500"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 3: Delivery Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  3. Delivery Date
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleDateShortcut(0)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      isToday
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDateShortcut(1)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      isTomorrow
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full py-2 px-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 4: Delivery Time Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  4. Delivery Time Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'border-brand-600 bg-sky-50/70 text-brand-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                          <span>{slot.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Instructions (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Delivery Notes / Gate Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring bell twice, leave on porch"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* STEP 5: Order Summary Review */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Product:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedProduct?.name} ({quantity}x)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Delivery Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
                    {profile?.address || 'No address set'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Payment Method:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Banknote className="w-3 h-3" /> Cash on Delivery
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Total Amount:</span>
                  <span className="text-base font-extrabold text-brand-700">
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer / Confirm Action */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            type="submit"
            form="refill-form"
            disabled={isSubmitting || loadingInitial || !profile?.address}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming Order...</span>
              </>
            ) : (
              <>
                <span>Confirm Order • {formatCurrency(estimatedTotal)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

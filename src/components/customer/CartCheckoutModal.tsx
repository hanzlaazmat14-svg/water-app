import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { DeliverySlot } from '../../lib/database.types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { businessConfig } from '../../config/business';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Banknote,
  ShieldCheck,
  Truck,
  Sparkles
} from 'lucide-react';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
  onEditAddress?: () => void;
}

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onEditAddress,
}) => {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, subtotal } = useCart();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  // 3-step checkout flow (matching Screenshot 3: 1 Order -> 2 Review -> 3 Pay)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [instructions, setInstructions] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    async function loadSlots() {
      try {
        const { data, error } = await supabase
          .from('delivery_slots')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setDeliverySlots(data as DeliverySlot[]);
          setSelectedSlotId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      }
    }

    if (isOpen) {
      loadSlots();
      setStep(1);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const selectedSlot = deliverySlots.find((s) => s.id === selectedSlotId);

  const handlePlaceOrder = async () => {
    if (!user) {
      setErrorMsg('Please sign in to complete your order.');
      return;
    }

    if (!profile?.address || profile.address.trim().length === 0) {
      setErrorMsg('Please set a delivery address before ordering.');
      onEditAddress?.();
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (!selectedSlotId) {
      setErrorMsg('Please select a delivery time slot.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const orderPayload = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.rpc('create_customer_order', {
        p_items: orderPayload,
        p_delivery_date: deliveryDate,
        p_slot_id: selectedSlotId,
        p_instructions: instructions.trim() || null,
      });

      if (error) throw error;

      showToast(`Order #${data.order_number} confirmed! Delivery on the way.`, 'success');
      clearCart();
      onOrderSuccess();
      onClose();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-slide-up">
        {/* Top Stepper Header (matching Reference Screenshot 3) */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Checkout</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Step Progress Stepper */}
          <div className="pt-1">
            <div className="flex items-center justify-between relative max-w-xs mx-auto">
              <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute left-6 top-3.5 h-0.5 bg-brand-600 transition-all duration-300 -z-0"
                style={{
                  width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
                }}
              />

              {/* Step 1: Order */}
              <button
                onClick={() => setStep(1)}
                className="flex flex-col items-center gap-1 z-10"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= 1
                      ? 'bg-brand-600 text-white shadow-sm ring-4 ring-sky-50'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  1
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    step === 1 ? 'text-brand-700' : 'text-slate-400'
                  }`}
                >
                  Order
                </span>
              </button>

              {/* Step 2: Review */}
              <button
                onClick={() => items.length > 0 && setStep(2)}
                disabled={items.length === 0}
                className="flex flex-col items-center gap-1 z-10"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= 2
                      ? 'bg-brand-600 text-white shadow-sm ring-4 ring-sky-50'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    step === 2 ? 'text-brand-700' : 'text-slate-400'
                  }`}
                >
                  Review
                </span>
              </button>

              {/* Step 3: Pay */}
              <button
                onClick={() => items.length > 0 && setStep(3)}
                disabled={items.length === 0}
                className="flex flex-col items-center gap-1 z-10"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= 3
                      ? 'bg-brand-600 text-white shadow-sm ring-4 ring-sky-50'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    step === 3 ? 'text-brand-700' : 'text-slate-400'
                  }`}
                >
                  Pay (COD)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: ORDER ITEMS (CART REVIEW) */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Cart Items ({totalItems})
                </h4>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Free Doorstep Delivery
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-brand-600 flex items-center justify-center mx-auto">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Your Cart is Empty</h5>
                  <p className="text-xs text-slate-400">
                    Add clean 19L refills or water accessories to order.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 space-y-2">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={product.image_url || '/images/products/bottle_19l.jpg'}
                          alt={product.name}
                          className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs leading-tight truncate">
                            {product.name}
                          </p>
                          <span className="text-[10px] text-slate-400 block">
                            {product.bottle_size} • {formatCurrency(product.price)} each
                          </span>
                        </div>
                      </div>

                      {/* Stepper + Price */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-900">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-xs text-slate-900 min-w-[60px] text-right font-mono">
                          {formatCurrency(product.price * quantity)}
                        </span>

                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: REVIEW & SCHEDULE (DATE, SLOT, ADDRESS) */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Delivery Scheduling Card (Reference 3) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Order will be delivered by {businessConfig.companyName} on:
                </span>

                {/* Date Quick Pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryDate(todayStr)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-left flex items-center justify-between ${
                      deliveryDate === todayStr
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>Today (Express)</span>
                    <Clock className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryDate(tomorrowStr)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-left flex items-center justify-between ${
                      deliveryDate === tomorrowStr
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>Tomorrow</span>
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Time Slot Picker */}
                <div>
                  <label className="font-bold text-slate-700 mb-1.5 block">
                    Preferred Time Window:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deliverySlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedSlotId === slot.id
                            ? 'bg-sky-50 border-brand-500 text-brand-800 ring-2 ring-brand-500/20 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold">{slot.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Address Verification */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    <span>Delivery Address</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditAddress?.();
                    }}
                    className="text-brand-600 font-bold hover:underline text-[11px]"
                  >
                    Change Pin ↗
                  </button>
                </div>

                <p className="text-slate-700 font-medium leading-snug">
                  {profile?.address || 'No address saved. Please pin your delivery address.'}
                </p>

                {profile?.latitude && profile?.longitude ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Exact GPS coordinates pinned
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600">
                    Tip: Pinned GPS lets rider arrive straight at your gate.
                  </span>
                )}
              </div>

              {/* Delivery Drop-off Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Gate / Drop-off Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring left bell, leave empties on porch"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: PAY (CASH ON DELIVERY) & FINAL CONFIRM */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Payment Method (COD Highlight) */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Cash on Delivery (COD)
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Pay upon arrival when bottles are handed over
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    Verified
                  </span>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Order Breakdown
                </h4>

                <div className="space-y-1.5 text-slate-600">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="font-mono font-semibold">{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span>Delivery Fee</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900 text-sm font-extrabold">
                    <span>Total Amount (COD)</span>
                    <span className="font-mono text-base text-brand-700">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>

              {/* Scheduled Delivery Recap */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 space-y-1">
                <p className="text-[11px]">
                  <strong>Delivery Date:</strong> {formatDate(deliveryDate)}
                </p>
                <p className="text-[11px]">
                  <strong>Time Slot:</strong> {selectedSlot?.name || 'Standard slot'}
                </p>
                <p className="text-[11px] truncate">
                  <strong>Address:</strong> {profile?.address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="px-3.5 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={items.length === 0}
              className="flex-1 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Schedule Delivery →</span>
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Review Payment (COD) →</span>
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order ({formatCurrency(subtotal)})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { Subscription, Product, DeliverySlot, SubscriptionFrequency } from '../../lib/database.types';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../../lib/utils';
import { businessConfig } from '../../config/business';
import { useToast } from '../../context/ToastContext';
import { SkipDeliveryModal } from '../../components/customer/SkipDeliveryModal';
import { CartCheckoutModal } from '../../components/customer/CartCheckoutModal';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Edit2,
  CheckCircle2,
  Pause,
  Play,
  Truck,
  Wrench,
  Sparkles,
  Droplet,
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface CustomerSubscriptionsProps {
  onNavigate?: (view: string) => void;
}

export const CustomerSubscriptions: React.FC<CustomerSubscriptionsProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onNavigate) onNavigate('customer-home');
    navigate('/');
  };

  const { user, profile } = useAuth();
  const { addToCart, isCartOpen, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // Skip modal
  const [skippingSub, setSkippingSub] = useState<Subscription | null>(null);

  // New Subscription Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('every_2_days');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subRes, prodRes, slotRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select(`
            *,
            product:products(*),
            delivery_slot:delivery_slots(*)
          `)
          .eq('customer_id', user.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false }),
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

      if (subRes.error) throw subRes.error;
      setSubscriptions((subRes.data || []) as Subscription[]);

      const fetchedProducts = (prodRes.data || []) as Product[];
      const fetchedSlots = (slotRes.data || []) as DeliverySlot[];
      setProducts(fetchedProducts);
      setSlots(fetchedSlots);

      if (fetchedProducts.length > 0) setSelectedProductId(fetchedProducts[0].id);
      if (fetchedSlots.length > 0) setSelectedSlotId(fetchedSlots[0].id);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('subscriptions').insert({
        customer_id: user.id,
        product_id: selectedProductId,
        quantity,
        frequency,
        delivery_slot_id: selectedSlotId || null,
        next_delivery_date: startDate,
        status: 'active',
      });

      if (error) throw error;
      showToast('Recurring refill plan created successfully!', 'success');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Create subscription error:', err);
      setErrorMsg(err.message || 'Failed to create subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (sub: Subscription) => {
    const nextStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      if (error) throw error;
      showToast(`Subscription ${nextStatus === 'active' ? 'resumed' : 'paused'}.`, 'info');
      loadData();
    } catch (err: any) {
      console.error('Update status error:', err);
      showToast(err.message || 'Failed to update subscription status.', 'error');
    }
  };

  const handleScheduleService = (serviceType: string) => {
    const url = getWhatsAppUrl(
      businessConfig.whatsappNumber,
      `Hello ${businessConfig.companyName}, I would like to schedule a "${serviceType}" for my home water setup.`
    );
    window.open(url, '_blank');
  };

  const handleTopUpNow = () => {
    const refillProd = products.find((p) => p.name.includes('19L Refill')) || products[0];
    if (refillProd) {
      addToCart(refillProd, 4);
      setIsCartOpen(true);
    }
  };

  const activeSub = subscriptions[0];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Subscriptions & Credits
            </h1>
            <p className="text-xs text-slate-500">
              Automated doorstep delivery on your schedule
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-subtle transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Plan</span>
        </button>
      </div>

      {/* Greeting Banner (Screenshot 4) */}
      <div className="space-y-0.5">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
          Hello {profile?.full_name ? profile.full_name.split(' ')[0] : 'Valued Customer'}!
        </h2>
        <p className="text-xs text-slate-500">
          Below is your bottle balance and recurring delivery details.
        </p>
      </div>

      {/* PREPAID / E-COUPON BOTTLE BALANCE RING CARD (Screenshot 4) */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50 rounded-3xl p-5 border border-sky-200 shadow-subtle flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Circular Balance Gauge */}
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm border-4 border-sky-400">
            <div className="text-center">
              <span className="text-xs font-extrabold text-brand-700 block leading-none">
                4/10
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">
                Left
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700 block">
              Bottle Credit Balance
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
              4 Refills Available
            </h4>
            <p className="text-[11px] text-slate-500">
              Enjoy uninterrupted automatic deliveries
            </p>
          </div>
        </div>

        <button
          onClick={handleTopUpNow}
          className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 shrink-0"
        >
          Top-Up Now →
        </button>
      </div>

      {/* MY SUBSCRIPTION DETAILS CARD (Screenshot 4) */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs font-medium">Loading subscription details...</span>
        </div>
      ) : activeSub ? (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-4">
          {/* Header with Bottle Image & Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={activeSub.product?.image_url || '/images/products/bottle_19l.jpg'}
                alt={activeSub.product?.name}
                className="w-14 h-14 object-contain rounded-2xl bg-sky-50 p-1.5 border border-sky-100"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {activeSub.product?.name || 'PakPure 19L Refill'}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeSub.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeSub.status === 'active' ? 'Active Plan' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quantity: <strong>{activeSub.quantity} Bottles</strong> • Every{' '}
                  {activeSub.frequency === 'daily'
                    ? '1 Day'
                    : activeSub.frequency === 'every_2_days'
                    ? '2 Days'
                    : activeSub.frequency === 'every_3_days'
                    ? '3 Days'
                    : 'Week'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleStatus(activeSub)}
              className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                activeSub.status === 'active'
                  ? 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
              title={activeSub.status === 'active' ? 'Pause Plan' : 'Resume Plan'}
            >
              {activeSub.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* Upcoming Bottle Delivery Box (Screenshot 4) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-600" />
                <span>Upcoming Bottle Delivery</span>
              </span>
              <button
                onClick={() => setSkippingSub(activeSub)}
                className="text-brand-600 font-bold hover:underline text-[11px]"
              >
                Skip Vacation Dates ↗
              </button>
            </div>

            <div className="space-y-1 text-slate-600 pt-1">
              <p>
                <strong>Delivery Date:</strong> {formatDate(activeSub.next_delivery_date)}
              </p>
              <p>
                <strong>Delivery Window:</strong> {activeSub.delivery_slot?.name || 'Morning Window'}
              </p>
              <p className="line-clamp-1">
                <strong>Address:</strong> {profile?.address || 'Saved Home Address'}
              </p>
            </div>
          </div>

          {/* Pause / Resume footer link */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={() => handleToggleStatus(activeSub)}
              className="font-bold text-slate-500 hover:text-slate-900"
            >
              {activeSub.status === 'active' ? 'Pause Subscription >' : 'Resume Subscription >'}
            </button>
            <button
              onClick={() => setSkippingSub(activeSub)}
              className="font-bold text-brand-600 hover:underline"
            >
              Manage Skip Dates &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No Active Recurring Plan</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Never run out of water! Set up automatic refills every 2 or 3 days with free doorstep delivery.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs shadow-subtle"
          >
            Create Refill Plan
          </button>
        </div>
      )}

      {/* MAINTENANCE & SANITATION SERVICES (Screenshot 4) */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
            Maintenance & Dispenser Services
          </h3>
          <p className="text-xs text-slate-400">
            Keep your drinking water 100% clean and hygienic
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Service 1: Sanitization */}
          <button
            onClick={() => handleScheduleService('Dispenser Deep Sanitization')}
            className="bg-white hover:bg-sky-50/50 p-4 rounded-2xl border border-slate-200 shadow-subtle text-left flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-brand-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-brand-700 transition-colors">
                  Schedule Dispenser Sanitization
                </h4>
                <p className="text-[11px] text-slate-500">
                  Chemical-free ozone & steam cleaning for your dispenser
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Service 2: Repair Service */}
          <button
            onClick={() => handleScheduleService('Dispenser / Pump Repair')}
            className="bg-white hover:bg-sky-50/50 p-4 rounded-2xl border border-slate-200 shadow-subtle text-left flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-rose-700 transition-colors">
                  Request Repair or Tap Replacement
                </h4>
                <p className="text-[11px] text-slate-500">
                  Fixed cold/hot faucets, leaks, and electric pump repair
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* FOOTER USP (Screenshot 4) */}
      <div className="text-center pt-3 space-y-1">
        <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Delivered to your doorstep
        </h4>
        <h3 className="text-lg font-extrabold text-rose-600 tracking-tight flex items-center justify-center gap-1.5">
          <span>for FREE.</span>
          <Truck className="w-5 h-5 inline" />
        </h3>
      </div>

      {/* Add Subscription Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4 animate-slide-up relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Create Recurring Refill Plan
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Select Bottle Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.bottle_size}) - {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Bottles per Delivery</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Delivery Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="daily">Every Day</option>
                    <option value="every_2_days">Every 2 Days</option>
                    <option value="every_3_days">Every 3 Days</option>
                    <option value="weekly">Once a Week</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Time Slot</label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                >
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">First Delivery Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Automated Deliveries'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Skip Delivery Dates Modal */}
      {skippingSub && (
        <SkipDeliveryModal
          subscription={skippingSub}
          isOpen={Boolean(skippingSub)}
          onClose={() => setSkippingSub(null)}
          onSuccess={loadData}
        />
      )}

      {/* Cart & Checkout Modal */}
      <CartCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={loadData}
      />
    </div>
  );
};

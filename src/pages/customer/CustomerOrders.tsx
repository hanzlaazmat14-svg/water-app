import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { Order, Product } from '../../lib/database.types';
import { ActiveOrderTracker } from '../../components/customer/ActiveOrderTracker';
import { formatCurrency, formatDate, getOrderStatusMeta } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Package,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Truck
} from 'lucide-react';

interface CustomerOrdersProps {
  onNavigate?: (view: string) => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onNavigate) onNavigate('customer-home');
    navigate('/');
  };

  const { user } = useAuth();
  const { addToCart, isCartOpen, setIsCartOpen } = useCart();

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ordersRes, prodRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            driver:profiles!orders_assigned_driver_id_fkey(*),
            delivery_slot:delivery_slots(*),
            order_items(*)
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('is_available', true),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      const allOrders = (ordersRes.data || []) as Order[];

      const active = allOrders.find((o) =>
        ['pending', 'confirmed', 'assigned', 'out_for_delivery'].includes(o.status)
      );
      const past = allOrders.filter(
        (o) => !['pending', 'confirmed', 'assigned', 'out_for_delivery'].includes(o.status)
      );

      setActiveOrder(active || null);
      setPastOrders(past);
      setProducts((prodRes.data || []) as Product[]);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handleBuyAgain = (order: Order) => {
    const firstItem = order.order_items?.[0];
    if (firstItem) {
      const prod = products.find((p) => p.id === firstItem.product_id);
      if (prod) {
        addToCart(prod, firstItem.quantity || 1);
        setIsCartOpen(true);
      }
    }
  };

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
              Track & Orders
            </h1>
            <p className="text-xs text-slate-500">
              Live delivery tracker, invoices, and re-orders
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs font-medium">Loading orders...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Live Order Tracker Section (Screenshot 5) */}
          {activeOrder && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Live Order Tracking
              </span>
              <ActiveOrderTracker order={activeOrder} onOrderUpdated={loadOrders} />
            </div>
          )}

          {/* 2. Past Orders History (Daraz / Amazon style invoice cards) */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Past Deliveries ({pastOrders.length})
            </h3>

            {pastOrders.length === 0 && !activeOrder ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No previous deliveries</h4>
                <p className="text-xs text-slate-400">
                  When you order water refills, your delivery history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastOrders.map((order) => {
                  const meta = getOrderStatusMeta(order.status);
                  const firstItem = order.order_items?.[0];

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl p-4 border border-slate-200 shadow-subtle space-y-3 hover:shadow-card transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #{order.order_number} • {formatDate(order.delivery_date)}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">
                            {firstItem ? `${firstItem.product_name} (${firstItem.quantity}x)` : 'Water Delivery'}
                          </h4>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Paid:</span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleBuyAgain(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-brand-700 hover:bg-sky-100 border border-sky-200 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Buy Again</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

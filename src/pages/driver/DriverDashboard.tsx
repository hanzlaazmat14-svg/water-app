import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order } from '../../lib/database.types';
import { optimizeDeliveryStops } from '../../lib/utils';
import { DriverStatsHeader } from '../../components/driver/DriverStatsHeader';
import { DeliveryCard } from '../../components/driver/DeliveryCard';
import { useToast } from '../../context/ToastContext';
import { Truck, Loader2, CheckCircle2, User } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadDriverDeliveries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Driver RLS guarantees they can only select their own assigned orders
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey(*),
          delivery_slot:delivery_slots(*),
          order_items(*)
        `)
        .eq('assigned_driver_id', user.id)
        .eq('delivery_date', todayStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAssignedOrders((data || []) as Order[]);
    } catch (err) {
      console.error('Error fetching driver orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverDeliveries();
  }, [user]);

  const handleOptimizeRoute = () => {
    setIsOptimizing(true);
    try {
      const optimized = optimizeDeliveryStops(assignedOrders);
      setAssignedOrders(optimized);
      showToast('Route reordered for minimum driving distance!', 'success');
    } catch (err) {
      console.error('Route optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const completedCount = assignedOrders.filter((o) => o.status === 'delivered').length;
  const failedCount = assignedOrders.filter((o) => o.status === 'failed').length;
  const remainingCount = assignedOrders.length - completedCount - failedCount;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-5 animate-fade-in">
      {/* Driver Welcome Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Dispatch Active
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Salam, {profile?.full_name || 'Driver'}
          </h1>
        </div>

        <Link
          to="/driver/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-subtle text-slate-700 hover:text-slate-900 text-xs font-bold transition-all active:scale-95"
        >
          <User className="w-3.5 h-3.5 text-brand-600" />
          <span>Profile</span>
        </Link>
      </div>

      {/* Driver Header Summary */}
      <DriverStatsHeader
        total={assignedOrders.length}
        completed={completedCount}
        remaining={remainingCount}
        failed={failedCount}
        onOptimizeRoute={handleOptimizeRoute}
        isOptimizing={isOptimizing}
      />

      {/* Assigned Deliveries List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
          Assigned Deliveries ({assignedOrders.length})
        </h3>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Loading your stops...</span>
          </div>
        ) : assignedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-brand-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">All clear for today</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No pending deliveries are currently assigned to you for today. Check with dispatch if needed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedOrders.map((order, idx) => (
              <DeliveryCard
                key={order.id}
                order={order}
                stopNumber={idx + 1}
                onOrderUpdated={loadDriverDeliveries}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

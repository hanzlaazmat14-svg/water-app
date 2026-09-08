import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../lib/database.types';
import { AdminStatsOverview } from '../../components/admin/AdminStatsOverview';
import { AdminOrdersTable } from '../../components/admin/AdminOrdersTable';
import { CustomerManager } from '../../components/admin/CustomerManager';
import { DriverManager } from '../../components/admin/DriverManager';
import { ProductManager } from '../../components/admin/ProductManager';
import { SlotManager } from '../../components/admin/SlotManager';
import { businessConfig } from '../../config/business';
import {
  LayoutDashboard,
  Clock,
  Users,
  Truck,
  Package,
  Calendar,
  Settings,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab, onTabChange }) => {
  const [activeTab, setActiveTab] = useState<string>(currentTab || 'overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCustCount, setActiveCustCount] = useState<number>(0);
  const [activeSubCount, setActiveSubCount] = useState<number>(0);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      // 1. Load orders with customer, driver, slots, items
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey(*),
          driver:profiles!orders_assigned_driver_id_fkey(*),
          delivery_slot:delivery_slots(*),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (orderErr) throw orderErr;
      setOrders((orderData || []) as Order[]);

      // 2. Count active customers
      const { count: custCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');
      setActiveCustCount(custCount || 0);

      // 3. Count active subscriptions
      const { count: subCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setActiveSubCount(subCount || 0);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  useEffect(() => {
    if (currentTab) {
      if (currentTab === 'admin-dashboard') setActiveTab('overview');
      else if (currentTab === 'admin-orders') setActiveTab('orders');
      else if (currentTab === 'admin-customers') setActiveTab('customers');
      else if (currentTab === 'admin-products') setActiveTab('products');
      else if (currentTab === 'admin-settings') setActiveTab('slots');
    }
  }, [currentTab]);

  // Compute operational stats
  const todayOrders = orders.filter((o) => o.delivery_date === todayStr);
  const pendingCount = todayOrders.filter((o) => o.status === 'pending').length;
  const assignedCount = todayOrders.filter((o) => o.status === 'assigned').length;
  const outForDeliveryCount = todayOrders.filter((o) => o.status === 'out_for_delivery').length;
  const deliveredTodayCount = todayOrders.filter((o) => o.status === 'delivered').length;
  const failedTodayCount = todayOrders.filter((o) => o.status === 'failed').length;

  const codExpected = todayOrders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'failed')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const codCollected = todayOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const stats = {
    totalOrdersToday: todayOrders.length,
    pendingOrders: pendingCount,
    assignedOrders: assignedCount,
    outForDelivery: outForDeliveryCount,
    deliveredToday: deliveredTodayCount,
    failedToday: failedTodayCount,
    codExpected,
    codCollected,
    activeCustomersCount: activeCustCount,
    activeSubscriptionsCount: activeSubCount,
  };

  const tabs = [
    { id: 'overview', label: 'Operations Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'All Orders', icon: Clock },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'drivers', label: 'Drivers', icon: Truck },
    { id: 'products', label: 'Products & Prices', icon: Package },
    { id: 'slots', label: 'Delivery Slots', icon: Calendar },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      if (tabId === 'overview') onTabChange('admin-dashboard');
      else if (tabId === 'orders') onTabChange('admin-orders');
      else if (tabId === 'customers') onTabChange('admin-customers');
      else if (tabId === 'products') onTabChange('admin-products');
      else if (tabId === 'slots') onTabChange('admin-settings');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6 animate-fade-in">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
            Owner Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {businessConfig.companyName} Operations
          </h1>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-subtle self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleSelectTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-brand-600 text-brand-600 bg-sky-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading && orders.length === 0 ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-medium">Loading operations data...</span>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <AdminStatsOverview stats={stats} />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Today&apos;s Dispatch Dispatcher ({todayOrders.length} orders)
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    View All Orders &rarr;
                  </button>
                </div>
                <AdminOrdersTable orders={orders} onOrderUpdated={loadAllAdminData} />
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTable orders={orders} onOrderUpdated={loadAllAdminData} />
          )}

          {activeTab === 'customers' && <CustomerManager />}

          {activeTab === 'drivers' && <DriverManager />}

          {activeTab === 'products' && <ProductManager />}

          {activeTab === 'slots' && <SlotManager />}
        </div>
      )}
    </div>
  );
};

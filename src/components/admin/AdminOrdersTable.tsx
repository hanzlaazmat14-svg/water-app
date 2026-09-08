import React, { useState } from 'react';
import { Order, OrderStatus } from '../../lib/database.types';
import { formatCurrency, formatDate, getDirectionsUrl, getPhoneUrl, getWhatsAppUrl } from '../../lib/utils';
import { StatusBadge } from '../common/StatusBadge';
import { AssignDriverModal } from './AssignDriverModal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  ChevronDown,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface AdminOrdersTableProps {
  orders: Order[];
  onOrderUpdated: () => void;
}

export const AdminOrdersTable: React.FC<AdminOrdersTableProps> = ({ orders, onOrderUpdated }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredOrders = orders.filter((o) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchNumber = String(o.order_number).includes(q);
      const matchCustomer = o.customer?.full_name?.toLowerCase().includes(q);
      const matchPhone = o.customer?.phone?.includes(q);
      const matchAddress = o.delivery_address?.toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer && !matchPhone && !matchAddress) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter === 'today' && o.delivery_date !== todayStr) {
      return false;
    }

    return true;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
        updates.payment_status = 'paid';
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      showToast(`Order status updated to ${newStatus}`, 'success');
      onOrderUpdated();
    } catch (err: any) {
      console.error('Update status error:', err);
      showToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, phone, order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Date Quick Filter */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === 'today'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Today's Deliveries
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Dates
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'assigned', label: 'Assigned' },
              { id: 'out_for_delivery', label: 'Out on Road' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'failed', label: 'Failed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List / Table */}
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No orders found matching the selected filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Details</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const firstItem = order.order_items?.[0];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number & Status */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="space-y-1">
                          <span>#{order.order_number}</span>
                          <div>
                            <StatusBadge status={order.status} size="sm" />
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {order.customer?.full_name || 'Customer'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                          <span>{order.customer?.phone}</span>
                          {order.customer?.phone && (
                            <a
                              href={getWhatsAppUrl(order.customer.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Delivery Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3 h-3 text-brand-600 shrink-0" />
                          <span>{formatDate(order.delivery_date)}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {order.delivery_slot?.name || 'Standard'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 mt-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{order.delivery_address}</span>
                          <a
                            href={getDirectionsUrl(order.delivery_latitude, order.delivery_longitude, order.delivery_address)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 hover:underline shrink-0"
                            title="Open map"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {firstItem ? `${firstItem.product_name} (${firstItem.quantity}x)` : '19L Refill'}
                        </span>
                        {order.order_items && order.order_items.length > 1 && (
                          <span className="text-[10px] text-slate-400 block">
                            +{order.order_items.length - 1} more
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          COD
                        </span>
                      </td>

                      {/* Driver Assignment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {order.driver ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {order.driver.full_name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {order.driver.full_name}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100 transition-colors"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>

                      {/* Quick Status Action Dropdown */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="assigned">Assigned</option>
                            <option value="out_for_delivery">Out on Road</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {order.driver && (
                            <button
                              onClick={() => setAssigningOrder(order)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-md"
                              title="Reassign driver"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {assigningOrder && (
        <AssignDriverModal
          isOpen={Boolean(assigningOrder)}
          onClose={() => setAssigningOrder(null)}
          order={assigningOrder}
          onSuccess={onOrderUpdated}
        />
      )}
    </>
  );
};

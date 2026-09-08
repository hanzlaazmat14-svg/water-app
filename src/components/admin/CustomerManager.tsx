import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/database.types';
import { formatDate, getDirectionsUrl, getWhatsAppUrl, getPhoneUrl } from '../../lib/utils';
import { Search, MapPin, Navigation, Phone, MessageCircle, User, Loader2 } from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCustomers((data || []) as Profile[]);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Customer Directory</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {customers.length} registered customer accounts
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs font-medium">Loading customers...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No customers found matching your search.
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className="p-4 rounded-2xl border border-slate-200 hover:border-brand-200 transition-all space-y-3 bg-slate-50/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-brand-700 font-extrabold flex items-center justify-center text-sm">
                    {customer.full_name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {customer.full_name}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Joined {formatDate(customer.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {customer.phone && (
                    <>
                      <a
                        href={getPhoneUrl(customer.phone)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-600 hover:bg-white"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={getWhatsAppUrl(customer.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{customer.address || 'No saved address'}</span>
                </div>

                {customer.latitude && customer.longitude && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pl-5">
                    <Navigation className="w-3 h-3 fill-current" />
                    <a
                      href={getDirectionsUrl(customer.latitude, customer.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      View Pin on Map
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

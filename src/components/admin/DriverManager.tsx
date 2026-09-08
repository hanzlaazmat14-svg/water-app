import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/database.types';
import { useToast } from '../../context/ToastContext';
import { Truck, Plus, CheckCircle2, XCircle, Phone, Loader2, UserPlus, X } from 'lucide-react';

export const DriverManager: React.FC = () => {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // New Driver Form
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers((data || []) as Profile[]);
    } catch (err) {
      console.error('Error loading drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleToggleStatus = async (driver: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: !driver.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driver.id);

      if (error) throw error;
      showToast(`Driver ${driver.full_name} status updated.`, 'info');
      loadDrivers();
    } catch (err: any) {
      console.error('Toggle driver error:', err);
      showToast(err.message || 'Failed to update driver status.', 'error');
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName || !newPhone) {
      showToast('Please fill all driver fields.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      // Create user via Supabase Auth with driver metadata
      const { data, error } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: newPassword,
        options: {
          data: {
            full_name: newName.trim(),
            phone: newPhone.trim(),
            role: 'driver',
          },
        },
      });

      if (error) throw error;

      showToast(`Driver account for ${newName} created!`, 'success');
      setIsAddOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewPhone('');
      await loadDrivers();
    } catch (err: any) {
      console.error('Create driver error:', err);
      showToast(err.message || 'Failed to create driver account.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Delivery Team</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your local dispatch riders & drivers
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Driver</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Loading drivers...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No drivers added yet. Click &quot;Add Driver&quot; above to create your first dispatch account.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{driver.full_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{driver.phone}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      driver.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {driver.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Dispatch Access:</span>
                  <button
                    onClick={() => handleToggleStatus(driver)}
                    className={`font-bold hover:underline ${
                      driver.is_active ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {driver.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Driver</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Driver Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Mahmood"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 03001234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Login Email</label>
                <input
                  type="email"
                  placeholder="driver@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Driver Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Driver Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

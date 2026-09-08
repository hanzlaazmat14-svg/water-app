import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { businessConfig } from '../../config/business';
import { getPhoneUrl, getWhatsAppUrl, formatDate } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Headphones,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ArrowLeft
} from 'lucide-react';

export const DriverProfile: React.FC = () => {
  const { profile, user, updateProfile, refreshProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [stats, setStats] = useState<{ totalCompleted: number; totalAssigned: number }>({
    totalCompleted: 0,
    totalAssigned: 0,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    async function loadDriverLifetimeStats() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('assigned_driver_id', user.id);

        if (error) throw error;
        if (data) {
          const completed = data.filter((o) => o.status === 'delivered').length;
          setStats({
            totalAssigned: data.length,
            totalCompleted: completed,
          });
        }
      } catch (err) {
        console.error('Error fetching driver lifetime stats:', err);
      }
    }

    loadDriverLifetimeStats();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });

      if (error) throw error;
      showToast('Driver details updated!', 'success');
      await refreshProfile();
    } catch (err: any) {
      console.error('Update driver profile error:', err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/driver');
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/driver')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Driver Profile & Shift
            </h1>
            <p className="text-xs text-slate-500">
              Official delivery rider information
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Driver Badge Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-extrabold text-lg text-white shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">
                {profile?.full_name || 'Delivery Hero'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Authorized Field Driver
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Active Duty
          </span>
        </div>

        {/* Lifetime Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] font-semibold text-slate-400 block">
              Deliveries Completed
            </span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {stats.totalCompleted}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] font-semibold text-slate-400 block">
              Total Stops Assigned
            </span>
            <span className="text-xl font-extrabold text-white font-mono">
              {stats.totalAssigned}
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch Supervisor Helpline */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Headphones className="w-4 h-4 text-brand-600" />
          <span>Warehouse & Dispatch Helpline</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Need assistance with stock, route changes, or customer issues? Contact the plant manager directly:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={getPhoneUrl(businessConfig.phone)}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-brand-600" />
            <span>Call Plant</span>
          </a>

          <a
            href={getWhatsAppUrl(businessConfig.whatsappNumber, `Driver alert from ${profile?.full_name}: I need assistance on my route.`)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp Dispatch</span>
          </a>
        </div>
      </div>

      {/* Driver Info Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">
          Personal Contact Details
        </h3>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Account</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Contact Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

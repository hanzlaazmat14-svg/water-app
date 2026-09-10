import React, { useState, useEffect } from 'react';
import { useBusiness, DynamicBusinessInfo } from '../../context/BusinessContext';
import { useToast } from '../../context/ToastContext';
import { DeviceImageUpload } from '../common/DeviceImageUpload';
import {
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  DollarSign,
  Truck,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const BusinessSettingsManager: React.FC = () => {
  const { settings, updateSettings, isLoading } = useBusiness();
  const { showToast } = useToast();

  const [form, setForm] = useState<DynamicBusinessInfo>(settings);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Synchronize when settings load or update from backend
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field: keyof DynamicBusinessInfo, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await updateSettings(form);
      if (!res.success) {
        showToast(res.error || 'Failed to update business settings.', 'error');
      } else {
        showToast('Business info & branding updated successfully!', 'success');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const cleanWhatsappNumber = form.whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Live Storefront Customizer</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Business Info & Branding</h2>
            <p className="text-sky-200/80 text-xs sm:text-sm max-w-xl">
              Changes you make here instantly update the customer navbar, WhatsApp support chat, order receipts, and delivery policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setForm(settings)}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2"
              title="Discard unsaved changes and reload"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brand Identity & Logo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Identity Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Brand & Company Identity</h3>
                <p className="text-xs text-slate-500">Your customer-facing brand name, short title, and motto</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. AquaDrop Water Service"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Displayed on the header, invoice summaries, and title.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Short / Display Name
                </label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => handleChange('shortName', e.target.value)}
                  placeholder="e.g. AquaDrop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used in compact mobile bars, pills, and greetings.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Business Slogan / Tagline
              </label>
              <input
                type="text"
                value={form.slogan}
                onChange={(e) => handleChange('slogan', e.target.value)}
                placeholder="e.g. Pure, Mineral-Rich Hydration Delivered To Your Door"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Visible under banners and promotional footers.
              </span>
            </div>

            {/* Announcement Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Customer Top Banner Notice (Optional)
              </label>
              <input
                type="text"
                value={form.announcementText || ''}
                onChange={(e) => handleChange('announcementText', e.target.value)}
                placeholder="e.g. Free same-day delivery on all 19L orders placed before 3:00 PM!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Leave empty if no special alert or promo notice is active.
              </span>
            </div>
          </div>

          {/* Contact & WhatsApp Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">WhatsApp & Contact Channels</h3>
                <p className="text-xs text-slate-500">How customers contact you for instant queries and support</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  WhatsApp Support Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </span>
                  <input
                    type="text"
                    value={form.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="e.g. 923001234567 or 03001234567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-slate-50/30 focus:bg-white"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-slate-400">
                    Active digits: <code className="text-emerald-700 font-mono font-bold">{cleanWhatsappNumber || 'None'}</code>
                  </span>
                  {cleanWhatsappNumber && (
                    <a
                      href={`https://wa.me/${cleanWhatsappNumber}?text=Hello%20${encodeURIComponent(form.companyName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      <span>Test Chat Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Calling Phone Line
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-sky-600" />
                  </span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1.5 block">
                  Displayed as clickable phone link for call orders.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Support Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-indigo-500" />
                </span>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  placeholder="e.g. support@aquadrop.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all bg-slate-50/30 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Location & Delivery Policies */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Location & Delivery Charges</h3>
                <p className="text-xs text-slate-500">Service city, plant address, and delivery thresholds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Operating City
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g. Lahore / Karachi"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Currency Symbol
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </span>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    placeholder="e.g. Rs. or PKR"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Plant / Office Address
              </label>
              <textarea
                rows={2}
                value={form.businessAddress}
                onChange={(e) => handleChange('businessAddress', e.target.value)}
                placeholder="e.g. Plot 14, Industrial Zone, Gulberg III"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Standard Delivery Fee ({form.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.deliveryFee}
                  onChange={(e) => handleChange('deliveryFee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Set to 0 if delivery is free for all orders.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Free Delivery Minimum ({form.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.freeDeliveryThreshold}
                  onChange={(e) => handleChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all bg-slate-50/30 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Orders equal or above this amount receive free delivery.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Logo & Visual Branding Manager */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-5 sticky top-20">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Brand Logo</h3>
                <p className="text-xs text-slate-500">Live preview & URL customization</p>
              </div>
            </div>

            {/* Live Logo Preview Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Preview in Navbar Context</span>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center min-h-[110px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 p-1 flex items-center justify-center shadow-md">
                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain filter drop-shadow"
                        onError={(e) => {
                          // Fallback if image URL fails to load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Sparkles className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black text-white tracking-tight block leading-tight">
                      {form.shortName || form.companyName || 'AquaDrop'}
                    </span>
                    <span className="text-[9px] font-bold text-sky-300 uppercase tracking-wider block">
                      {form.city ? `${form.city} Delivery` : 'Express Delivery'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Logo From Device */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Upload Brand Logo From Device
              </label>
              <DeviceImageUpload
                folder="logos"
                label="Upload Logo (PNG, SVG, JPG)"
                helperText="Select or drop your logo file here"
                onImageUploaded={(url) => {
                  handleChange('logoUrl', url);
                }}
              />
            </div>

            {/* Logo Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Or Paste Logo URL / Local Path
                </label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="/logo.svg or https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all bg-slate-50/30 focus:bg-white"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Quick Logo Presets
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '/logo.svg')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      form.logoUrl === '/logo.svg'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <img src="/logo.svg" alt="Default Droplet" className="w-5 h-5 object-contain" />
                    <span>Droplet SVG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      !form.logoUrl
                        ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Default Icon</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <div className="text-[11px] text-sky-900 leading-relaxed">
                <strong className="font-bold">Instant Updates:</strong> Saving here commits to the live Supabase database. Your customers will see the updated brand name and WhatsApp number immediately without needing to reinstall or clear cache.
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Business Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

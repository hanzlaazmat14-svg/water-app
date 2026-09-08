import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { businessConfig } from '../../config/business';
import { useNavigate } from 'react-router-dom';
import { DriverProfile } from '../driver/DriverProfile';
import { detectLocation } from '../../lib/geolocation';
import { MapLocationPickerModal } from '../../components/common/MapLocationPickerModal';
import { AddToHomeScreenModal } from '../../components/common/AddToHomeScreenModal';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Compass,
  Crosshair,
  Smartphone,
  Download
} from 'lucide-react';

interface CustomerProfileProps {
  onNavigate?: (view: string) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onNavigate) onNavigate('customer-home');
    navigate('/');
  };

  const { profile, user, role, updateProfile, refreshProfile } = useAuth();
  const { isStandalone } = usePWAInstall();

  // If driver user lands on this component, render the driver profile
  if (role === 'driver') {
    return <DriverProfile />;
  }

  const { showToast } = useToast();

  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
      setInstructions(profile.delivery_instructions || '');
    }
  }, [profile]);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await detectLocation();
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);

      // If address is empty, auto-populate with the detected area & city
      if (!address.trim()) {
        setAddress(loc.formattedAddress);
      }

      showToast(`Location detected (${loc.source === 'gps' ? 'GPS' : 'Network/IP'}): ${loc.formattedAddress}`, 'success');
    } catch (err: any) {
      console.warn('Geo error:', err);
      showToast(err.message || 'Unable to detect location. You can enter your street address manually.', 'info');
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirmMapLocation = (loc: { latitude: number; longitude: number; address: string }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
    showToast('Location pinned on map!', 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMsg('Please enter a delivery address.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        latitude,
        longitude,
        delivery_instructions: instructions.trim() || null,
      });

      if (error) throw error;
      showToast('Delivery address & profile updated successfully!', 'success');
      await refreshProfile();
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Delivery Profile & Address
          </h1>
          <p className="text-xs text-slate-500">
            Set your exact address so delivery drivers can navigate directly to your gate
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Muhammad Ali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number (Calling / WhatsApp)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="03001234567"
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

          {/* Delivery Address & Map Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="font-bold text-slate-700">Home Delivery Address</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="text-[11px] font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                >
                  <Compass className="w-3.5 h-3.5 text-brand-600" />
                  <span>Select on Map</span>
                </button>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-xl flex items-center gap-1 transition-colors"
                  title="Try Auto GPS Detection"
                >
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
                  <span>Auto Detect</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                placeholder="House / Flat #, Street #, Sector / Colony, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>

            {latitude && longitude ? (
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> GPS Pin Saved ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                </p>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-brand-600 hover:underline font-bold"
                >
                  View on Map ↗
                </a>
              </div>
            ) : (
              <p className="text-[10px] text-amber-600 mt-1">
                Tip: Tap <strong>"Select on Map"</strong> to drop a pin on your building so the rider drives straight to you.
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Gate / Drop-off Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ring left bell, leave empties outside"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-medium"
            />
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
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Delivery Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Dedicated Add to Home Screen PWA Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-subtle space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 p-2 shadow-sm flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                {businessConfig.shortName} on Home Screen
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Install as a mobile app for fast 1-tap refills and instant tracking
              </p>
            </div>
          </div>

          {isStandalone && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Installed
            </span>
          )}
        </div>

        {isStandalone ? (
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>You are currently running the official app from your home screen.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(true)}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Add to Home Screen / Install App</span>
          </button>
        )}
      </div>

      {/* Interactive Map Location Picker Modal */}
      <MapLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmMapLocation}
        initialLat={latitude}
        initialLng={longitude}
        initialAddress={address}
      />

      {/* Add to Home Screen Guided Modal */}
      <AddToHomeScreenModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};

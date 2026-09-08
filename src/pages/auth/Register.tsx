import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { businessConfig } from '../../config/business';
import { useNavigate } from 'react-router-dom';
import { detectLocation } from '../../lib/geolocation';
import { MapLocationPickerModal } from '../../components/common/MapLocationPickerModal';
import {
  MapPin,
  Navigation,
  Phone,
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Compass,
  Crosshair
} from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onSuccess }) => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [locating, setLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  const handleConfirmMapLocation = (loc: { latitude: number; longitude: number; address: string }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
    showToast('Location pinned on map!', 'success');
  };

  const handleDetectLocation = async () => {
    setLocating(true);
    try {
      const loc = await detectLocation();
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);

      if (!address.trim()) {
        setAddress(loc.formattedAddress);
      }

      showToast(`Location detected (${loc.source === 'gps' ? 'GPS' : 'Network/IP'}): ${loc.formattedAddress}`, 'success');
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      showToast(err.message || 'Unable to detect location. Please enter your street address manually.', 'info');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName || !phone || !email || !password || !address) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        latitude,
        longitude,
        deliveryInstructions: instructions.trim() || undefined,
        role: 'customer',
      });

      if (error) throw error;

      showToast('Account created! Address and location saved.', 'success');
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 p-2.5 shadow-sm flex items-center justify-center text-white mx-auto">
            <img src={businessConfig.logoUrl} alt={businessConfig.companyName} className="w-full h-full object-contain filter brightness-0 invert" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Create Customer Account
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Set your delivery location once and enjoy instant 1-tap refills.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Asad Malik"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="0300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="asad@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Home Delivery Address */}
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
                  disabled={locating}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-xl flex items-center gap-1 transition-colors"
                  title="Try Auto GPS Detection"
                >
                  {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
                  <span>Auto Detect</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="House / Flat #, Street #, Sector / Area, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
            {latitude && longitude && (
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
            )}
          </div>

          {/* Gate instructions */}
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              Delivery Notes / Floor (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 2nd Floor, bell is on right"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account & Save Location'
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={() => (onSwitchToLogin ? onSwitchToLogin() : navigate('/login'))}
              className="font-bold text-brand-600 hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
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
    </div>
  );
};

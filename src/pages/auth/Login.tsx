import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../lib/supabase';
import { businessConfig } from '../../config/business';
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck, Truck, User } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
  portalMode?: 'customer' | 'driver' | 'admin';
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onSuccess, portalMode = 'customer' }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const { settings } = useBusiness();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) throw error;

      showToast('Signed in successfully!', 'success');

      // Check role to route directly to respective dashboard
      if (portalMode === 'driver') {
        navigate('/driver');
      } else if (portalMode === 'admin') {
        navigate('/admin');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (prof?.role === 'driver') {
            navigate('/driver');
            return;
          } else if (prof?.role === 'admin') {
            navigate('/admin');
            return;
          }
        }
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 p-2 shadow-sm flex items-center justify-center text-white mx-auto overflow-hidden">
            <img
              src={settings.logoUrl || '/logo.svg'}
              alt={settings.companyName}
              className={`w-full h-full object-contain ${
                settings.logoUrl === '/logo.svg' || !settings.logoUrl ? 'filter brightness-0 invert' : ''
              }`}
            />
          </div>

          {portalMode === 'admin' ? (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Owner / Admin Portal
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Operations Sign In
              </h2>
            </div>
          ) : portalMode === 'driver' ? (
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <Truck className="w-3.5 h-3.5" /> Driver Delivery Mode
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Driver Dispatch Sign In
              </h2>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Sign in to order your water refill or manage deliveries.
              </p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>


        {onSwitchToRegister && (
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New customer?{' '}
              <button
                onClick={onSwitchToRegister}
                className="font-bold text-brand-600 hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

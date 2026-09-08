import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider, useCart } from './context/CartContext';
import { CartCheckoutModal } from './components/customer/CartCheckoutModal';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { CustomerHome } from './pages/customer/CustomerHome';
import { CustomerOrders } from './pages/customer/CustomerOrders';
import { CustomerSubscriptions } from './pages/customer/CustomerSubscriptions';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverProfile } from './pages/driver/DriverProfile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

const DriverRoute: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-xs font-semibold">Verifying driver dispatch access...</span>
      </div>
    );
  }

  // If user is authenticated as driver or admin, grant access to driver dashboard
  if (user && (role === 'driver' || role === 'admin')) {
    return <DriverDashboard />;
  }

  // Otherwise, show dedicated Driver Login
  return (
    <div className="py-6">
      <Login
        portalMode="driver"
        onSuccess={() => navigate('/driver')}
        onSwitchToRegister={() => navigate('/register')}
      />
    </div>
  );
};

const DriverProfileRoute: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-xs font-semibold">Loading driver profile...</span>
      </div>
    );
  }

  if (user && (role === 'driver' || role === 'admin')) {
    return <DriverProfile />;
  }

  return (
    <div className="py-6">
      <Login
        portalMode="driver"
        onSuccess={() => navigate('/driver/profile')}
        onSwitchToRegister={() => navigate('/register')}
      />
    </div>
  );
};

const ProfileRoute: React.FC = () => {
  const { role } = useAuth();
  if (role === 'driver') {
    return <DriverProfile />;
  }
  return <CustomerProfile />;
};

const AdminRoute: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-xs font-semibold">Verifying administrative access...</span>
      </div>
    );
  }

  // If user is authenticated as admin, grant access
  if (user && role === 'admin') {
    return <AdminDashboard />;
  }

  // Otherwise, show dedicated Admin Login
  return (
    <div className="py-6">
      <Login
        portalMode="admin"
        onSuccess={() => navigate('/admin')}
        onSwitchToRegister={() => navigate('/register')}
      />
    </div>
  );
};

const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Login
      portalMode="customer"
      onSuccess={() => navigate('/')}
      onSwitchToRegister={() => navigate('/register')}
    />
  );
};

const RegisterRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Register
      onSuccess={() => navigate('/')}
      onSwitchToLogin={() => navigate('/login')}
    />
  );
};

const AppLayout: React.FC = () => {
  const { isLoading, role } = useAuth();
  const { isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-xs font-semibold text-slate-500">Loading water delivery portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-sky-500 selection:text-white">
      <NetworkStatusBanner />
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* 1. Customer Dedicated Portal */}
          <Route path="/" element={<CustomerHome />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/subscriptions" element={<CustomerSubscriptions />} />
          <Route path="/profile" element={<ProfileRoute />} />

          {/* 2. Driver Dedicated Portal */}
          <Route path="/driver" element={<DriverRoute />} />
          <Route path="/driver/profile" element={<DriverProfileRoute />} />

          {/* 3. Owner / Admin Dedicated Portal */}
          <Route path="/admin" element={<AdminRoute />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global 3-Step Checkout Drawer (Screenshot 3) - available across all customer screens */}
      {role !== 'driver' && (
        <CartCheckoutModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onOrderSuccess={() => {
            setIsCartOpen(false);
            navigate('/orders');
          }}
          onEditAddress={() => {
            setIsCartOpen(false);
            navigate('/profile');
          }}
        />
      )}

      <BottomNav />
      <PWAInstallPrompt />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <AppLayout />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

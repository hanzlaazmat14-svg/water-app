import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkStatusBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-fade-in sticky top-0 z-50">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Please check your internet connection to place orders.</span>
    </div>
  );
};

import React from 'react';
import { MapPin, Navigation, Edit2, AlertCircle } from 'lucide-react';
import { Profile } from '../../lib/database.types';

interface AddressCardProps {
  profile: Profile | null;
  onEdit: () => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({ profile, onEdit }) => {
  const hasAddress = Boolean(profile?.address && profile.address.trim().length > 0);
  const hasCoordinates = Boolean(profile?.latitude && profile?.longitude);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${hasAddress ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
          <MapPin className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivery Address
            </span>
            {hasCoordinates ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Navigation className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" /> GPS Pin Set
              </span>
            ) : hasAddress ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                No GPS coordinates
              </span>
            ) : null}
          </div>

          {hasAddress ? (
            <>
              <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                {profile?.address}
              </p>
              {profile?.delivery_instructions && (
                <p className="text-xs text-slate-500 mt-0.5 italic truncate">
                  Note: {profile.delivery_instructions}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Please set your delivery address to order</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onEdit}
        className="shrink-0 p-2 text-slate-400 hover:text-brand-600 hover:bg-sky-50 rounded-xl transition-colors active:scale-95"
        title="Edit Address"
        aria-label="Edit address"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );
};

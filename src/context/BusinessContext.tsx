import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { businessConfig, BusinessConfig } from '../config/business';
import { BusinessSettings } from '../lib/database.types';

export interface DynamicBusinessInfo {
  companyName: string;
  shortName: string;
  slogan: string;
  logoUrl: string;
  phone: string;
  whatsappNumber: string;
  supportEmail: string;
  businessAddress: string;
  city: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  announcementText: string | null;
}

interface BusinessContextType {
  settings: DynamicBusinessInfo;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newValues: Partial<DynamicBusinessInfo>) => Promise<{ success: boolean; error?: string }>;
}

const defaultDynamicSettings: DynamicBusinessInfo = {
  companyName: businessConfig.companyName,
  shortName: businessConfig.shortName,
  slogan: businessConfig.slogan,
  logoUrl: businessConfig.logoUrl,
  phone: businessConfig.phone,
  whatsappNumber: businessConfig.whatsappNumber,
  supportEmail: businessConfig.supportEmail,
  businessAddress: businessConfig.businessAddress,
  city: businessConfig.city,
  currency: businessConfig.currency,
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  minOrderAmount: 0,
  announcementText: null,
};

const BusinessContext = createContext<BusinessContextType>({
  settings: defaultDynamicSettings,
  isLoading: false,
  refreshSettings: async () => {},
  updateSettings: async () => ({ success: false }),
});

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DynamicBusinessInfo>(() => {
    // Try to load cached settings from localStorage for instant flash-free rendering
    try {
      const cached = localStorage.getItem('water_app_business_settings');
      if (cached) {
        return { ...defaultDynamicSettings, ...JSON.parse(cached) };
      }
    } catch (e) {
      // Ignore
    }
    return defaultDynamicSettings;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const merged: DynamicBusinessInfo = {
          companyName: data.company_name || businessConfig.companyName,
          shortName: data.short_name || businessConfig.shortName,
          slogan: data.slogan || businessConfig.slogan,
          logoUrl: data.logo_url || businessConfig.logoUrl,
          phone: data.phone || businessConfig.phone,
          whatsappNumber: data.whatsapp_number || businessConfig.whatsappNumber,
          supportEmail: data.support_email || businessConfig.supportEmail,
          businessAddress: data.business_address || businessConfig.businessAddress,
          city: data.city || businessConfig.city,
          currency: data.currency || businessConfig.currency,
          deliveryFee: Number(data.delivery_fee) || 0,
          freeDeliveryThreshold: Number(data.free_delivery_threshold) || 0,
          minOrderAmount: Number(data.min_order_amount) || 0,
          announcementText: data.announcement_text,
        };

        setSettings(merged);
        try {
          localStorage.setItem('water_app_business_settings', JSON.stringify(merged));
        } catch (e) {
          // Ignore
        }
      }
    } catch (err) {
      console.warn('Could not load dynamic business settings, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime updates on business_settings
    const channel = supabase
      .channel('public:business_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  // Dynamically synchronize document title, favicon, apple-touch-icon, and PWA manifest with active business settings
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Update Document Title
    if (settings.companyName) {
      document.title = `${settings.companyName} - Water Delivery`;
    }

    const currentLogo = settings.logoUrl || '/logo.svg';

    // 2. Update Browser Favicon
    const favicon = (document.getElementById('app-favicon') ||
      document.querySelector("link[rel='icon']")) as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = currentLogo;
      favicon.type = currentLogo.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    }

    // 3. Update Apple Touch Icon (Home screen icon on iOS)
    let appleTouch = (document.getElementById('app-apple-touch-icon') ||
      document.querySelector("link[rel='apple-touch-icon']")) as HTMLLinkElement | null;
    if (appleTouch) {
      appleTouch.href = currentLogo;
    }

    // 4. Update Dynamic PWA Web App Manifest (Home screen icon & app name on Android / Chrome)
    try {
      const manifestObj = {
        name: settings.companyName || 'Water Delivery App',
        short_name: settings.shortName || settings.companyName || 'Water App',
        description: settings.slogan || 'Pure drinking water delivered to your doorstep.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0284c7',
        orientation: 'portrait',
        icons: [
          {
            src: currentLogo,
            sizes: '192x192 512x512',
            type: currentLogo.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'any maskable',
          },
        ],
      };

      const blob = new Blob([JSON.stringify(manifestObj)], { type: 'application/manifest+json' });
      const manifestUrl = URL.createObjectURL(blob);
      const manifestLink = (document.getElementById('app-manifest') ||
        document.querySelector("link[rel='manifest']")) as HTMLLinkElement | null;
      if (manifestLink) {
        manifestLink.href = manifestUrl;
      }
    } catch (e) {
      console.warn('Could not update dynamic web manifest:', e);
    }
  }, [settings]);

  const updateSettings = async (newValues: Partial<DynamicBusinessInfo>) => {
    try {
      const dbPayload: Partial<BusinessSettings> = {
        updated_at: new Date().toISOString(),
      };

      if (newValues.companyName !== undefined) dbPayload.company_name = newValues.companyName.trim();
      if (newValues.shortName !== undefined) dbPayload.short_name = newValues.shortName.trim();
      if (newValues.slogan !== undefined) dbPayload.slogan = newValues.slogan.trim();
      if (newValues.logoUrl !== undefined) dbPayload.logo_url = newValues.logoUrl.trim();
      if (newValues.phone !== undefined) dbPayload.phone = newValues.phone.trim();
      if (newValues.whatsappNumber !== undefined) dbPayload.whatsapp_number = newValues.whatsappNumber.replace(/[^0-9]/g, '');
      if (newValues.supportEmail !== undefined) dbPayload.support_email = newValues.supportEmail.trim();
      if (newValues.businessAddress !== undefined) dbPayload.business_address = newValues.businessAddress.trim();
      if (newValues.city !== undefined) dbPayload.city = newValues.city.trim();
      if (newValues.currency !== undefined) dbPayload.currency = newValues.currency.trim();
      if (newValues.deliveryFee !== undefined) dbPayload.delivery_fee = newValues.deliveryFee;
      if (newValues.freeDeliveryThreshold !== undefined) dbPayload.free_delivery_threshold = newValues.freeDeliveryThreshold;
      if (newValues.minOrderAmount !== undefined) dbPayload.min_order_amount = newValues.minOrderAmount;
      if (newValues.announcementText !== undefined) dbPayload.announcement_text = newValues.announcementText?.trim() || null;

      const { error } = await supabase
        .from('business_settings')
        .update(dbPayload)
        .eq('id', 'default');

      if (error) throw error;

      // Optimistically update local state
      setSettings((prev) => {
        const updated = { ...prev, ...newValues };
        try {
          localStorage.setItem('water_app_business_settings', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return { success: true };
    } catch (err: any) {
      console.error('Failed to update business settings:', err);
      return { success: false, error: err.message || 'Failed to save settings' };
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);

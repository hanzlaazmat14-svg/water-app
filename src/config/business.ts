/**
 * ==============================================================================
 * CENTRALIZED WHITE-LABEL BUSINESS CONFIGURATION
 * ==============================================================================
 * This is the SINGLE SOURCE OF TRUTH for your water delivery company branding.
 * When duplicating this master repository for a new client:
 * 1. Modify the details below to match the client's business.
 * 2. Update their Supabase credentials in .env.
 * 3. Deploy!
 */

export interface BusinessConfig {
  companyName: string;
  shortName: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  whatsappNumber: string; // digits only with country code, e.g., '923001234567'
  supportEmail: string;
  businessAddress: string;
  city: string;
  country: string;
  currency: string;
  currencyCode: string;
  timezone: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  delivery: {
    estimatedTime: string;
    cashOnDeliveryNote: string;
    freeDeliveryMessage: string;
  };
}

export const businessConfig: BusinessConfig = {
  // Brand Identity
  companyName: "PakPure Mineral Water",
  shortName: "PakPure",
  slogan: "Pure, Safe & Mineral-Rich Water Delivered Straight to Your Door",
  logoUrl: "/logo.svg",
  faviconUrl: "/logo.svg",

  // Contact & Support
  phone: "+92 300 8555123",
  whatsappNumber: "923008555123",
  supportEmail: "support@pakpurewater.pk",
  businessAddress: "Plot 42, Industrial Area, I-9/3, Islamabad",
  city: "Islamabad & Rawalpindi",
  country: "Pakistan",

  // Financial & Regional Settings
  currency: "Rs.",
  currencyCode: "PKR",
  timezone: "Asia/Karachi",

  // Brand Color Theming
  colors: {
    primary: "#0284c7",   // Sky 600
    secondary: "#0f172a", // Slate 900
    accent: "#38bdf8",    // Sky 400
  },

  // Operational Messaging
  delivery: {
    estimatedTime: "Delivered within your chosen slot",
    cashOnDeliveryNote: "Pay cash to the delivery hero upon receiving your bottles.",
    freeDeliveryMessage: "Free doorstep delivery across service zones",
  }
};

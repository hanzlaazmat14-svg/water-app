import { businessConfig } from '../config/business';
import { OrderStatus } from './database.types';

export function formatCurrency(amount: number | null | undefined): string {
  const safeAmount = Number(amount) || 0;
  return `${businessConfig.currency} ${safeAmount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMsg = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

export function getPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

export function getDirectionsUrl(lat?: number | null, lng?: number | null, address?: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }
  return 'https://maps.google.com';
}

export interface StatusMeta {
  label: string;
  step: number;
  badgeClass: string;
  description: string;
}

export function getOrderStatusMeta(status: OrderStatus): StatusMeta {
  switch (status) {
    case 'pending':
      return {
        label: 'Order Placed',
        step: 1,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Your refill request has been received.',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        step: 2,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        description: 'Order confirmed and bottles reserved.',
      };
    case 'assigned':
      return {
        label: 'Driver Assigned',
        step: 3,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: 'Assigned to your area delivery hero.',
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        step: 4,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
        description: 'Delivery vehicle is in your neighborhood.',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        step: 5,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Bottles successfully handed over.',
      };
    case 'failed':
      return {
        label: 'Delivery Unsuccessful',
        step: -1,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Delivery could not be completed.',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        step: -1,
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        description: 'Order cancelled.',
      };
  }
}

/**
 * Client-side route optimization fallback:
 * Nearest-neighbor ordering based on GPS coordinates.
 */
export function optimizeDeliveryStops<T extends { delivery_latitude: number | null; delivery_longitude: number | null }>(
  stops: T[],
  startLat?: number,
  startLng?: number
): T[] {
  if (stops.length <= 1) return [...stops];

  const unvisited = [...stops];
  const ordered: T[] = [];

  let currentLat = startLat ?? (stops[0].delivery_latitude || 33.6844);
  let currentLng = startLng ?? (stops[0].delivery_longitude || 73.0479);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const stop = unvisited[i];
      const stopLat = stop.delivery_latitude ?? currentLat;
      const stopLng = stop.delivery_longitude ?? currentLng;

      // Euclidean approximation for small city distances
      const dLat = stopLat - currentLat;
      const dLng = stopLng - currentLng;
      const dist = dLat * dLat + dLng * dLng;

      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextStop = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(nextStop);
    if (nextStop.delivery_latitude && nextStop.delivery_longitude) {
      currentLat = nextStop.delivery_latitude;
      currentLng = nextStop.delivery_longitude;
    }
  }

  return ordered;
}

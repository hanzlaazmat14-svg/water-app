import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '../../lib/geolocation';
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Check,
  Loader2,
  Navigation,
  Compass
} from 'lucide-react';

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
}

// Major cities in Pakistan for 1-tap quick jumps
const QUICK_CITIES = [
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
];

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Default to provided coords, or Islamabad if none
  const defaultLat = initialLat && initialLat > 0 ? initialLat : 33.6844;
  const defaultLng = initialLng && initialLng > 0 ? initialLng : 73.0479;

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });

  const [resolvedAddress, setResolvedAddress] = useState<string>(initialAddress);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Initialize and tear down Leaflet map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 16,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Re-trigger layout calculation
      map.invalidateSize();

      // Listen for map movements
      map.on('move', () => {
        const center = map.getCenter();
        setCurrentCoords({ lat: center.lat, lng: center.lng });
      });

      map.on('moveend', async () => {
        const center = map.getCenter();
        setCurrentCoords({ lat: center.lat, lng: center.lng });

        if (!isMounted) return;
        setIsResolving(true);
        try {
          const geo = await reverseGeocode(center.lat, center.lng);
          if (isMounted) {
            setResolvedAddress(geo.formattedAddress);
          }
        } catch (err) {
          console.error('Reverse geocode error on drag:', err);
        } finally {
          if (isMounted) setIsResolving(false);
        }
      });

      // Tap to center
      map.on('click', (e) => {
        map.panTo(e.latlng);
      });

      // Initial reverse geocode if no address provided
      if (!initialAddress) {
        reverseGeocode(defaultLat, defaultLng).then((geo) => {
          if (isMounted && geo.formattedAddress) {
            setResolvedAddress(geo.formattedAddress);
          }
        });
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Search places in Pakistan
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pk&limit=4`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch (err) {
        console.warn('Search geocode error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectSearchResult = (latStr: string, lonStr: string, displayName: string) => {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!isNaN(lat) && !isNaN(lon) && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 17);
      setResolvedAddress(displayName.split(',').slice(0, 3).join(', '));
      setShowResults(false);
      setSearchQuery('');
    }
  };

  const handleFlyToCity = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
        }
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Device GPS unavailable:', err);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: Number(currentCoords.lat.toFixed(6)),
      longitude: Number(currentCoords.lng.toFixed(6)),
      address: resolvedAddress || `Location (${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)})`,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl h-[92vh] max-h-[750px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slide-up">
        {/* Modal Top Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Select Exact Delivery Location
              </h3>
              <p className="text-[11px] text-slate-500">
                Drag the map to place the pin directly on your gate / home
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Quick Jump City Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 space-y-2 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search area, sector, or colony (e.g. F-7/2 Islamabad, Gulberg Lahore)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}

            {/* Search Dropdown Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-elevated border border-slate-200 z-30 overflow-hidden divide-y divide-slate-100">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSearchResult(res.lat, res.lon, res.display_name)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 flex items-start gap-2 text-slate-800 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{res.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick City Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
              Quick:
            </span>
            {QUICK_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleFlyToCity(city.lat, city.lng)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-600 shrink-0 transition-colors shadow-2xs"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container Viewport */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Fixed Central Delivery Drop Pin (Uber/Careem style) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 -translate-y-6">
            <div className="relative flex flex-col items-center">
              {/* Floating Address Bubble over Pin */}
              <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-elevated whitespace-nowrap mb-1 flex items-center gap-1.5 backdrop-blur-sm animate-bounce-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Delivery Gate Here</span>
              </div>

              {/* Pin Icon */}
              <div className="w-10 h-10 text-brand-600 drop-shadow-md">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full stroke-white stroke-2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>

              {/* Target Drop Shadow Dot */}
              <div className="w-3 h-1.5 bg-black/30 rounded-full blur-[1px] -mt-1" />
            </div>
          </div>

          {/* Device GPS "Locate Me" Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocatingUser}
            title="Locate my position with device GPS"
            className="absolute right-4 bottom-4 z-20 w-11 h-11 rounded-2xl bg-white text-slate-700 shadow-elevated border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-transform active:scale-90"
          >
            {isLocatingUser ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            ) : (
              <Crosshair className="w-5 h-5 text-brand-600" />
            )}
          </button>
        </div>

        {/* Bottom Pinned Address Preview & Confirmation */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selected Pin Location
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                {isResolving ? (
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving neighborhood name...
                  </span>
                ) : (
                  resolvedAddress || 'Move map to resolve street address'
                )}
              </p>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                Coordinates: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm Pinned Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

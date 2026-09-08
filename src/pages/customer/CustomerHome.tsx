import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { Order, Product, Subscription } from '../../lib/database.types';
import { formatCurrency } from '../../lib/utils';
import { businessConfig } from '../../config/business';
import { ActiveOrderTracker } from '../../components/customer/ActiveOrderTracker';
import { MapLocationPickerModal } from '../../components/common/MapLocationPickerModal';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronDown,
  Droplet,
  Sparkles,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Truck,
  ArrowRight,
  Layers,
  Package,
  Zap,
  Tag,
  Loader2,
  X
} from 'lucide-react';

interface CustomerHomeProps {
  onNavigate?: (view: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { items, addToCart, isCartOpen, setIsCartOpen, totalItems, subtotal } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Category Filter (Screenshot 2)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Hero angle/thumbnail selection (Screenshot 1)
  const [heroImageIdx, setHeroImageIdx] = useState<number>(0);

  // Modals
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  // Quantity tracker per product in the 2-column grid
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const heroThumbnails = [
    { label: '19L Refill', src: '/images/products/bottle_19l.jpg' },
    { label: '19L New Bottle', src: '/images/products/bottle_19l_new.jpg' },
    { label: '6L Bottle', src: '/images/products/bottle_6l.jpg' },
    { label: 'Electric Pump', src: '/images/products/water_pump.jpg' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch products
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (prodErr) throw prodErr;
      setProducts((prodData || []) as Product[]);

      // 2. Fetch active order if user is logged in
      if (user) {
        const { data: activeData } = await supabase
          .from('orders')
          .select(`
            *,
            driver:profiles!orders_assigned_driver_id_fkey(*),
            delivery_slot:delivery_slots(*),
            order_items(*)
          `)
          .eq('customer_id', user.id)
          .in('status', ['pending', 'confirmed', 'assigned', 'out_for_delivery'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setActiveOrder((activeData as Order) || null);
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filtered products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bottle_size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = true;
      if (selectedCategory === 'refills') {
        matchesCategory = p.name.toLowerCase().includes('refill');
      } else if (selectedCategory === 'small') {
        matchesCategory = p.name.toLowerCase().includes('6l') || p.name.toLowerCase().includes('pack');
      } else if (selectedCategory === 'pumps') {
        matchesCategory = p.name.toLowerCase().includes('pump') || p.name.toLowerCase().includes('dispenser');
      } else if (selectedCategory === 'deposits') {
        matchesCategory = p.name.toLowerCase().includes('new bottle');
      }

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    addToCart(product, qty);
  };

  const handleQuickRefillNow = (primaryProduct?: Product) => {
    const target = primaryProduct || products.find((p) => p.name.includes('19L Refill')) || products[0];
    if (target) {
      addToCart(target, 1);
      setIsCartOpen(true);
    }
  };

  const mainHeroProduct = products.find((p) => p.name.includes('19L Refill')) || products[0];

  return (
    <div className="max-w-2xl mx-auto pb-32 space-y-5 animate-fade-in">
      {/* DARAZ / AMAZON STYLE TOP HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-16 z-20 shadow-xs space-y-2.5">
        {/* Deliver To Location Bar */}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center gap-1.5 text-slate-800 hover:text-brand-600 transition-colors font-medium max-w-[80%] text-left"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="text-slate-400 shrink-0">Deliver to:</span>
            <span className="font-bold truncate text-slate-900">
              {profile?.address ? profile.address : 'Select Location on Map'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Cart Icon in Header */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            title="Open Cart"
          >
            <ShoppingCart className="w-5 h-5 text-slate-800" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-scale-up">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar (Reference 2) */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="What can we help you find today?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-100 border border-transparent focus:bg-white focus:border-brand-500 text-xs font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE ORDER LIVE TRACKER BANNER (Reference 5) */}
      {activeOrder && (
        <div className="px-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Order in Progress</span>
            </span>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              View Tracker →
            </button>
          </div>
          <ActiveOrderTracker order={activeOrder} onOrderUpdated={loadData} />
        </div>
      )}

      {/* SCREENSHOT 1: HERO SHOWCASE ("Quality hydration one click away.") */}
      <div className="px-4">
        <div className="bg-gradient-to-b from-sky-50/80 via-white to-sky-50/30 rounded-3xl p-5 sm:p-6 border border-sky-100 shadow-subtle space-y-4 relative overflow-hidden">
          {/* Subtle Water Splash Glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Headlines (Reference 1) */}
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Quality hydration
            </h2>
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-600 tracking-tight leading-tight">
              one click away.
            </h3>
          </div>

          {/* Main Hero Bottle Display */}
          <div className="relative flex items-center justify-center py-2">
            <img
              src={heroThumbnails[heroImageIdx].src}
              alt={heroThumbnails[heroImageIdx].label}
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain drop-shadow-xl transition-all duration-300 hover:scale-105"
            />

            {/* Quick 100% RO Mineral Purity Badge */}
            <span className="absolute top-0 right-2 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-brand-700 border border-sky-200 shadow-xs backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              100% Mineral Pure
            </span>
          </div>

          {/* Thumbnail Angles / Carousel (Reference 1) */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {heroThumbnails.map((thumb, idx) => (
              <button
                key={idx}
                onClick={() => setHeroImageIdx(idx)}
                className={`p-1 rounded-xl border transition-all ${
                  heroImageIdx === idx
                    ? 'border-brand-600 bg-white shadow-sm ring-2 ring-brand-500/20 scale-105'
                    : 'border-slate-200 bg-white/80 hover:border-slate-300 opacity-70'
                }`}
              >
                <img src={thumb.src} alt={thumb.label} className="w-10 h-10 object-contain rounded-lg" />
              </button>
            ))}
          </div>

          {/* Product Title & Pricing (Reference 1) */}
          <div className="space-y-1 text-center">
            <h4 className="font-extrabold text-slate-900 text-base">
              {mainHeroProduct?.name || 'PakPure 5-Gallon (19L) Refill'}
            </h4>
            <p className="text-xs text-slate-500">
              {mainHeroProduct?.bottle_size || '19 Litres / 5 Gallon'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <span className="text-lg font-extrabold text-brand-700 font-mono">
                {formatCurrency(mainHeroProduct?.price || 150)}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                Rs. 180
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Free Delivery
              </span>
            </div>
          </div>

          {/* Mineral Highlight Banner (Reference 1 cyan bar) */}
          <div className="bg-[#0ea5e9] text-white py-2 px-3 rounded-xl text-center shadow-xs">
            <p className="text-xs font-bold tracking-tight">
              Sodium free. Packed with essential minerals.
            </p>
          </div>

          {/* Dominant 1-Click Fast Refill Action */}
          <button
            onClick={() => handleQuickRefillNow(mainHeroProduct)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white font-extrabold text-sm sm:text-base shadow-elevated transition-all flex items-center justify-between active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Droplet className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="tracking-tight">1-CLICK ORDER REFILL (COD)</span>
            </div>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* SCREENSHOT 2: "A bottle for every occasion." CATEGORY BAR & CATALOG */}
      <div className="px-4 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Explore All Products
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            A bottle for every occasion.
          </h3>
        </div>

        {/* Horizontal Category Circular Icon Bar (Reference 2) */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'All Products', icon: Layers },
            { id: 'refills', label: 'Water Refill', icon: Droplet },
            { id: 'small', label: 'Small Formats', icon: Package },
            { id: 'pumps', label: 'Pumps & Spouts', icon: Zap },
            { id: 'deposits', label: 'New Bottles', icon: Tag },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-md ring-4 ring-sky-100 scale-105'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    isSelected ? 'text-brand-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-COLUMN DARAZ / AMAZON PRODUCT GRID (Reference 2) */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs">Loading water products...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No products found</h4>
            <p className="text-xs text-slate-400">Try changing your search term or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const currentQty = quantities[product.id] || 1;
              const cartItem = items.find((i) => i.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between relative group"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      {product.name.includes('19L') ? 'HOT REFILL' : 'BESTSELLER'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      COD
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="w-full h-32 sm:h-36 flex items-center justify-center mb-2 bg-slate-50/50 rounded-2xl p-2">
                    <img
                      src={product.image_url || '/images/products/bottle_19l.jpg'}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {product.bottle_size}
                    </p>
                  </div>

                  {/* Quantity Stepper (Reference 2 style directly on card) */}
                  <div className="pt-2.5 pb-2">
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1 border border-slate-200">
                      <button
                        onClick={() => handleQtyChange(product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900">
                        {currentQty}
                      </span>
                      <button
                        onClick={() => handleQtyChange(product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Add to Cart Button (Reference 2) */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through font-mono">
                        {formatCurrency(product.price * 1.2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                        cartItem
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                      }`}
                    >
                      {cartItem ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Added ({cartItem.quantity})</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PERSISTENT FLOATING CART BAR (DARAZ / FOODPANDA STYLE) */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-30 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-4 rounded-3xl shadow-float border border-slate-800 flex items-center justify-between hover:bg-black transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-brand-600 flex items-center justify-center font-extrabold text-xs">
                {totalItems}
              </div>
              <div className="text-left">
                <span className="font-extrabold text-sm block leading-none">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'} in Cart
                </span>
                <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                  Total: {formatCurrency(subtotal)} • COD
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-sky-400">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* MAP LOCATION PICKER */}
      <MapLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={async (loc) => {
          showToast(`Location updated to ${loc.address}`, 'success');
          loadData();
        }}
        initialLat={profile?.latitude}
        initialLng={profile?.longitude}
        initialAddress={profile?.address || ''}
      />
    </div>
  );
};

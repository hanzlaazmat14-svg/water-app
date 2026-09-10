import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../lib/database.types';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import {
  Package,
  Edit2,
  Plus,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Trash2
} from 'lucide-react';

const PRODUCT_IMAGE_PRESETS = [
  {
    name: '19L Refill',
    url: '/images/products/bottle_19l.jpg',
    size: '19L',
  },
  {
    name: '19L New Bottle',
    url: '/images/products/bottle_19l_new.jpg',
    size: '19L',
  },
  {
    name: '6L Bottle',
    url: '/images/products/bottle_6l.jpg',
    size: '6L',
  },
  {
    name: 'Bottle Pack',
    url: '/images/products/bottle_pack.jpg',
    size: 'Bundle',
  },
  {
    name: 'Electric Pump',
    url: '/images/products/water_pump.jpg',
    size: 'Accessory',
  },
  {
    name: 'Dispenser Combo',
    url: '/images/products/dispenser_combo.jpg',
    size: 'Dispenser',
  },
];

export const ProductManager: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Product Modal / Drawer State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editSize, setEditSize] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add Product Form Modal State
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newSize, setNewSize] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('/images/products/bottle_19l.jpg');
  const [newDesc, setNewDesc] = useState<string>('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStartEdit = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditSize(prod.bottle_size);
    setEditPrice(String(prod.price));
    setEditImageUrl(prod.image_url || '');
    setEditDesc(prod.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const numPrice = parseFloat(editPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }
    if (!editName.trim()) {
      showToast('Product name cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          bottle_size: editSize.trim() || editingProduct.bottle_size,
          price: numPrice,
          image_url: editImageUrl.trim() || null,
          description: editDesc.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      showToast(`Updated product "${editName}" and image!`, 'success');
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      console.error('Save product error:', err);
      showToast(err.message || 'Failed to update product.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_available: !prod.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prod.id);

      if (error) throw error;
      showToast(
        `Product "${prod.name}" is now ${!prod.is_available ? 'Available' : 'Disabled'}.`,
        'info'
      );
      await loadProducts();
    } catch (err: any) {
      console.error('Toggle availability error:', err);
      showToast(err.message || 'Failed to update availability.', 'error');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice);
    if (!newName || !newSize || isNaN(priceNum)) {
      showToast('Please enter valid product details.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('products').insert({
        name: newName.trim(),
        bottle_size: newSize.trim(),
        price: priceNum,
        image_url: newImageUrl.trim() || null,
        description: newDesc.trim() || null,
        is_available: true,
        display_order: products.length + 1,
      });

      if (error) throw error;
      showToast(`Added product "${newName}" successfully!`, 'success');
      setIsAddOpen(false);
      setNewName('');
      setNewSize('');
      setNewPrice('');
      setNewImageUrl('/images/products/bottle_19l.jpg');
      setNewDesc('');
      await loadProducts();
    } catch (err: any) {
      console.error('Add product error:', err);
      showToast(err.message || 'Failed to add product.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.name}" from your catalog?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', prod.id);
      if (error) throw error;
      showToast(`Deleted "${prod.name}"`, 'info');
      if (editingProduct?.id === prod.id) {
        setEditingProduct(null);
      }
      await loadProducts();
    } catch (err: any) {
      console.error('Delete product error:', err);
      showToast(err.message || 'Could not delete product.', 'error');
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-bold mb-1">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>Live Catalog & Photos</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Product & Pricing Catalog</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change product photos, update pricing, bottle sizes, and inventory status instantly.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Loading catalog...</span>
          </div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              return (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Product Visual & Header */}
                  <div>
                    <div className="relative h-44 bg-gradient-to-b from-slate-50 to-slate-100/60 p-4 flex items-center justify-center border-b border-slate-100 group">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="h-full max-h-36 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center shadow-sm">
                          <Package className="w-8 h-8" />
                        </div>
                      )}

                      {/* Availability Badge */}
                      <span
                        onClick={() => handleToggleAvailability(prod)}
                        className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer select-none transition-all shadow-sm ${
                          prod.is_available
                            ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                            : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                        }`}
                        title="Click to toggle availability"
                      >
                        {prod.is_available ? 'Available' : 'Disabled'}
                      </span>

                      {/* Bottle Size Tag */}
                      <span className="absolute bottom-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 shadow-sm">
                        {prod.bottle_size}
                      </span>
                    </div>

                    {/* Details Body */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                        {prod.name}
                      </h4>
                      {prod.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions Footer */}
                  <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Customer Price
                      </span>
                      <span className="text-lg font-extrabold text-brand-700 font-mono">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartEdit(prod)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit & Photo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Product & Photo</h3>
                  <span className="text-[11px] text-slate-500">Updating {editingProduct.name}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
              {/* Image Preview & Preset Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="block font-bold text-slate-700 text-xs">
                  Product Photo / Image
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {editImageUrl ? (
                      <img
                        src={editImageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <span className="text-[11px] text-slate-500 block">
                      Choose from standard bottle presets or paste a custom image URL below:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. /images/products/bottle_19l.jpg or https://..."
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Available Stock Image Presets
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRODUCT_IMAGE_PRESETS.map((preset) => {
                      const isSelected = editImageUrl === preset.url;
                      return (
                        <button
                          type="button"
                          key={preset.url}
                          onClick={() => setEditImageUrl(preset.url)}
                          className={`p-1.5 rounded-xl border text-center transition-all group flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 line-clamp-1">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Title & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    Bottle Size Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    placeholder="e.g. 19 Litres"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  Selling Price (Rs.) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Explain water purification method or bottle type..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(editingProduct)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bottle Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Add New Water Product</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4 overflow-y-auto">
              {/* Image Picker */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="block font-bold text-slate-700 text-xs">
                  Select Product Image
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {newImageUrl ? (
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Image URL or choose preset below"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRODUCT_IMAGE_PRESETS.map((preset) => {
                    const isSelected = newImageUrl === preset.url;
                    return (
                      <button
                        type="button"
                        key={preset.url}
                        onClick={() => setNewImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-center transition-all group flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 line-clamp-1">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 19L Premium Refill"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Bottle Size Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 19 Litres"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Selling Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Mineral content or delivery details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

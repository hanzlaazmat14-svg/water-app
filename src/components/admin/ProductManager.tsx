import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../lib/database.types';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { Package, Edit2, Plus, Check, X, Loader2 } from 'lucide-react';

export const ProductManager: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add Product Form
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newSize, setNewSize] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
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
    setEditingId(prod.id);
    setEditPrice(String(prod.price));
    setEditName(prod.name);
  };

  const handleSaveEdit = async (prodId: string) => {
    const numPrice = parseFloat(editPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          price: numPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prodId);

      if (error) throw error;
      showToast('Product price and details updated!', 'success');
      setEditingId(null);
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
      showToast(`Product is now ${!prod.is_available ? 'Available' : 'Unavailable'}.`, 'info');
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
      setNewDesc('');
      await loadProducts();
    } catch (err: any) {
      console.error('Add product error:', err);
      showToast(err.message || 'Failed to add product.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Product & Pricing Catalog</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live prices from database. Changes take effect instantly for all customers.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bottle</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="text-xs font-medium">Loading catalog...</span>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((prod) => {
              const isEditing = editingId === prod.id;
              return (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-sky-700 flex items-center justify-center font-bold overflow-hidden p-1 shrink-0">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-sky-600" />
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-xs font-bold px-2 py-1 border border-slate-300 rounded-lg bg-white"
                          />
                        ) : (
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {prod.name}
                          </h4>
                        )}
                        <span className="text-[11px] text-slate-500 font-medium">
                          {prod.bottle_size}
                        </span>
                      </div>
                    </div>

                    <span
                      onClick={() => handleToggleAvailability(prod)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer select-none transition-colors ${
                        prod.is_available
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                      title="Click to toggle availability"
                    >
                      {prod.is_available ? 'Available' : 'Disabled'}
                    </span>
                  </div>

                  {/* Price Row */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Customer Price
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-bold text-slate-600">Rs.</span>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 text-xs font-bold px-2 py-1 border border-brand-500 rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-base font-extrabold text-brand-700 font-mono">
                          {formatCurrency(prod.price)}
                        </span>
                      )}
                    </div>

                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(prod.id)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(prod)}
                          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-brand-600 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Price</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Bottle Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">Add New Bottle Product</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. 19L Premium Refill"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Bottle Size Label</label>
                <input
                  type="text"
                  placeholder="e.g. 19 Litres"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Product description..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

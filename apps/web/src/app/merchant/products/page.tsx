'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney } from '../../../lib/api';

export default function MerchantProductsPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Staples');
  const [price, setPrice] = useState('8.99');
  const [unit, setUnit] = useState('1 lb pack');
  const [stock, setStock] = useState('30');
  const [emoji, setEmoji] = useState('🛒');
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('GET', '/api/merchant/products', null, token);
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest(
        'POST',
        '/api/merchant/products',
        {
          name,
          category,
          price: parseFloat(price),
          unit,
          stock: parseInt(stock, 10),
          emoji,
        },
        token,
      );
      setShowAddModal(false);
      setName('');
      await loadProducts();
      alert('Product created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStock = async (productId: number, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      await apiRequest('PUT', `/api/merchant/products/${productId}`, { stock: nextStock }, token);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: nextStock } : p)),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user || user.role !== 'merchant') {
    return (
      <div className="container section center" style={{ padding: '80px 20px' }}>
        <h2>Merchant Portal</h2>
        <p className="muted small">Please sign in as a merchant.</p>
        <Link href="/login" className="btn btn-primary mt16">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="row between mb24">
        <div>
          <h1 className="display">Product Catalog & Stock</h1>
          <p className="muted small mt0">
            Manage your items, set prices, and update available Saturday inventory.
          </p>
        </div>
        <div className="row" style={{ gap: '10px' }}>
          <Link href="/merchant" className="btn btn-ghost btn-sm">
            ← Order Kanban
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card pad0">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '12px 16px' }}>Item</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Price</th>
              <th style={{ padding: '12px 16px' }}>Unit</th>
              <th style={{ padding: '12px 16px' }}>In Stock</th>
              <th style={{ padding: '12px 16px' }}>Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div className="row" style={{ gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{p.emoji || '🛒'}</span>
                    <div>
                      <b>{p.name}</b>
                      {!p.active && <span className="badge b-red" style={{ marginLeft: '8px' }}>Hidden</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }} className="muted small">
                  {p.category}
                </td>
                <td style={{ padding: '12px 16px' }} className="strong">
                  {formatMoney(p.priceCents)}
                </td>
                <td style={{ padding: '12px 16px' }} className="muted small">
                  {p.unit}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    className={`badge ${p.stock < 10 ? 'b-red' : p.stock < 25 ? 'b-amber' : 'b-green'}`}
                  >
                    {p.stock} units
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div className="row" style={{ gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateStock(p.id, p.stock, -1)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px' }}
                    >
                      −1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStock(p.id, p.stock, +5)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px' }}
                    >
                      +5
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div
          className="modal-bg"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="modal card" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="card-h">
              <h3>Add New Product</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="icon-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="stack mt16" style={{ gap: '14px' }}>
              <label className="field">
                Product name
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fresh Ripe Plantains"
                  required
                />
              </label>

              <div className="form-grid">
                <label className="field span3">
                  Price ($)
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </label>

                <label className="field span3">
                  Unit
                  <input
                    type="text"
                    className="input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. 5 count bunch"
                    required
                  />
                </label>
              </div>

              <div className="form-grid">
                <label className="field span3">
                  Category
                  <input
                    type="text"
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </label>

                <label className="field span3">
                  Initial Stock
                  <input
                    type="number"
                    className="input"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="field">
                Emoji icon
                <input
                  type="text"
                  className="input"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="e.g. 🍌"
                />
              </label>

              <div className="row mt16" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

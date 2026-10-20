'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';

export default function AdminStoresPage() {
  const { user, token } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStores = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('GET', '/api/admin/stores', null, token);
      setStores(res.stores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, [token]);

  const handleUpdateStatus = async (storeId: number, status: string) => {
    try {
      await apiRequest('POST', `/api/admin/stores/${storeId}`, { status }, token);
      await loadStores();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateCommission = async (storeId: number, rate: number) => {
    try {
      await apiRequest('POST', `/api/admin/stores/${storeId}`, { commission_rate: rate }, token);
      await loadStores();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container section center">
        <h2>Admin Console</h2>
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
          <h1 className="display">Store Approvals & Commissions</h1>
          <p className="muted small mt0">
            Review new merchant applications in Silver Spring, MD and adjust custom commission rates (default 15%).
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost btn-sm">
          ← Overview
        </Link>
      </div>

      <div className="card pad0">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '12px 16px' }}>Storefront</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Location</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Commission Rate</th>
              <th style={{ padding: '12px 16px' }}>Catalog Items</th>
              <th style={{ padding: '12px 16px' }}>Review Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div className="row" style={{ gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{s.emoji || '🏪'}</span>
                    <div>
                      <b>{s.name}</b>
                      <div className="tiny muted">{s.owner_name} ({s.owner_email})</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }} className="muted small">
                  {s.category}
                </td>
                <td style={{ padding: '12px 16px' }} className="tiny muted">
                  {s.city}, {s.state} {s.zip}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    className={`badge ${
                      s.status === 'active' ? 'b-green' : s.status === 'pending' ? 'b-amber' : 'b-red'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div className="row" style={{ gap: '6px' }}>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="50"
                      className="input"
                      style={{ width: '70px', padding: '4px 8px', fontSize: '13px' }}
                      defaultValue={Math.round(s.commissionRate * 100)}
                      onBlur={(e) => handleUpdateCommission(s.id, parseInt(e.target.value, 10) / 100)}
                    />
                    <span className="small muted">%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }} className="muted small">
                  {s.product_count} active items
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {s.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(s.id, 'active')}
                      className="btn btn-success btn-sm"
                    >
                      Approve Store ✓
                    </button>
                  ) : s.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(s.id, 'suspended')}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)' }}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(s.id, 'active')}
                      className="btn btn-primary btn-sm"
                    >
                      Re-activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

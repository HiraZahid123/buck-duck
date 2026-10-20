'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney, formatDate } from '../../../lib/api';

export default function AdminOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundOrder, setRefundOrder] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Customer service resolution');
  const [refunding, setRefunding] = useState(false);

  const loadData = async () => {
    if (!token) return;
    try {
      const [ordRes, drvRes] = await Promise.all([
        apiRequest('GET', '/api/admin/orders', null, token),
        apiRequest('GET', '/api/admin/drivers', null, token),
      ]);
      setOrders(ordRes.orders || []);
      setDrivers(drvRes.drivers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAssignDriver = async (orderId: number, driverId: string) => {
    try {
      await apiRequest(
        'POST',
        `/api/admin/orders/${orderId}`,
        { driver_id: driverId ? parseInt(driverId, 10) : null },
        token,
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Driver assignment failed');
    }
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder) return;
    setRefunding(true);
    try {
      const cents = Math.round(parseFloat(refundAmount) * 100);
      await apiRequest(
        'POST',
        `/api/admin/orders/${refundOrder.id}/refund`,
        { amount_cents: cents, reason: refundReason },
        token,
      );
      setRefundOrder(null);
      alert('Refund processed successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    } finally {
      setRefunding(false);
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
          <h1 className="display">Live Dispatch & Order Management</h1>
          <p className="muted small mt0">
            Monitor real-time pipeline status, manually reassign delivery drivers, and process refunds.
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
              <th style={{ padding: '12px 16px' }}>Order #</th>
              <th style={{ padding: '12px 16px' }}>Store</th>
              <th style={{ padding: '12px 16px' }}>Customer</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Assigned Driver</th>
              <th style={{ padding: '12px 16px' }}>Total</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <b>{o.number}</b>
                  <div className="tiny muted">{o.window?.date}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>{o.store?.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div>{o.customer?.name}</div>
                  <div className="tiny muted">{o.phone}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge b-gold">{o.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    className="input"
                    style={{ padding: '6px 8px', fontSize: '13px' }}
                    value={o.driver?.id || ''}
                    onChange={(e) => handleAssignDriver(o.id, e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.driver_online ? '(Online)' : ''}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '12px 16px' }} className="strong">
                  {formatMoney(o.totalCents)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundOrder(o);
                      setRefundAmount((o.totalCents / 100).toFixed(2));
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red)', borderColor: 'var(--red-bg)' }}
                  >
                    Refund
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REFUND MODAL */}
      {refundOrder && (
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
          <div className="modal card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="card-h">
              <h3>Issue Refund: {refundOrder.number}</h3>
              <button type="button" onClick={() => setRefundOrder(null)} className="icon-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueRefund} className="stack mt16" style={{ gap: '14px' }}>
              <div className="small muted">
                Original total: <b>{formatMoney(refundOrder.totalCents)}</b>
              </div>

              <label className="field">
                Refund amount ($)
                <input
                  type="number"
                  step="0.01"
                  max={(refundOrder.totalCents / 100).toFixed(2)}
                  className="input"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                Reason for refund
                <input
                  type="text"
                  className="input"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                />
              </label>

              <div className="row mt16" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setRefundOrder(null)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={refunding} className="btn btn-danger">
                  {refunding ? 'Refunding...' : 'Confirm Stripe Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

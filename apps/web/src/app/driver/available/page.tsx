'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney, formatTime } from '../../../lib/api';

export default function DriverAvailableJobsPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const loadJobs = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('GET', '/api/driver/available', null, token);
      setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [token]);

  const handleClaim = async (orderId: number) => {
    setClaimingId(orderId);
    try {
      await apiRequest('POST', `/api/driver/orders/${orderId}/claim`, null, token);
      alert('Delivery claimed and added to your Saturday route!');
      await loadJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to claim delivery');
    } finally {
      setClaimingId(null);
    }
  };

  if (!user || user.role !== 'driver') {
    return (
      <div className="container section center">
        <h2>Driver Portal</h2>
        <Link href="/login" className="btn btn-primary mt16">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container section" style={{ maxWidth: '640px' }}>
      <div className="row between mb16">
        <div>
          <h1 className="display">Available Deliveries</h1>
          <p className="muted small mt0">
            {orders.length} ready order{orders.length === 1 ? '' : 's'} waiting for pickup across Silver Spring, MD
          </p>
        </div>
        <Link href="/driver" className="btn btn-ghost btn-sm">
          ← Driver Home
        </Link>
      </div>

      {!user.driverOnline && (
        <div className="alert warn mb16" style={{ background: 'var(--amber-bg)', padding: '12px', borderRadius: '8px', color: 'var(--amber)' }}>
          ⚠️ You are currently offline. Please go online on the Driver Home screen to claim deliveries.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card center mt24" style={{ padding: '40px' }}>
          <div style={{ fontSize: '40px' }}>📭</div>
          <h3 className="mt8">No open jobs right now</h3>
          <p className="muted small">
            Stores seal bags and mark orders ready throughout Saturday morning. Check back shortly!
          </p>
        </div>
      ) : (
        <div className="stack" style={{ gap: '14px' }}>
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="row between">
                <div>
                  <span className="strong" style={{ fontSize: '16px' }}>{o.number}</span>
                  <span className="badge b-gold" style={{ marginLeft: '8px' }}>
                    {o.window ? `${o.window.date} · ${o.window.label}` : 'Saturday'}
                  </span>
                </div>
                <span className="badge b-green" style={{ fontSize: '14px' }}>
                  {formatMoney(o.driverPayCents)}
                </span>
              </div>

              <div className="stack mt12" style={{ gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <div className="row" style={{ gap: '10px' }}>
                  <span>🏪</span>
                  <div>
                    <div className="strong small">{o.store?.name}</div>
                    <div className="tiny muted">{o.store?.address}, Silver Spring, MD</div>
                  </div>
                </div>

                <div className="row" style={{ gap: '10px' }}>
                  <span>🏠</span>
                  <div>
                    <div className="strong small">Delivery: {o.city}, {o.state} {o.zip}</div>
                    <div className="tiny muted">Exact street address revealed upon claiming</div>
                  </div>
                </div>
              </div>

              <div className="row between mt12 tiny muted" style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                <span>🛍️ Collect {o.bags} BuckDuck bag{o.bags > 1 ? 's' : ''} ({o.item_count} items)</span>
                <span>Includes {formatMoney(o.tipCents)} tip</span>
              </div>

              <button
                type="button"
                disabled={claimingId === o.id || !user.driverOnline}
                onClick={() => handleClaim(o.id)}
                className="btn btn-primary btn-block mt16"
              >
                {claimingId === o.id ? 'Claiming job...' : `Accept Delivery (${formatMoney(o.driverPayCents)})`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

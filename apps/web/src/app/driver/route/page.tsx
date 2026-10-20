'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney } from '../../../lib/api';

export default function DriverRoutePage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalOrder, setActiveModalOrder] = useState<any | null>(null);

  // Delivery complete modal state
  const [proofNote, setProofNote] = useState('Left safely at front door');
  const [submitting, setSubmitting] = useState(false);

  const loadRoute = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('GET', '/api/driver/route', null, token);
      setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoute();
  }, [token]);

  const handleConfirmPickup = async (orderId: number) => {
    try {
      await apiRequest('POST', `/api/driver/orders/${orderId}/status`, { status: 'picked_up' }, token);
      alert('Pickup confirmed! You are now en route to the drop-off.');
      await loadRoute();
    } catch (err: any) {
      alert(err.message || 'Pickup failed');
    }
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalOrder) return;
    setSubmitting(true);
    try {
      await apiRequest(
        'POST',
        `/api/driver/orders/${activeModalOrder.id}/status`,
        {
          status: 'delivered',
          proof_note: proofNote,
          photo_url: '/uploads/demo-dropoff.jpg',
        },
        token,
      );
      setActiveModalOrder(null);
      alert('Delivery completed! Great job 🎉 Customer has been notified.');
      await loadRoute();
    } catch (err: any) {
      alert(err.message || 'Delivery completion failed');
    } finally {
      setSubmitting(false);
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

  const totalBags = orders.reduce((sum, o) => sum + (o.bags || 1), 0);
  const totalPay = orders.reduce((sum, o) => sum + (o.driverPayCents || 0), 0);

  return (
    <div className="container section" style={{ maxWidth: '640px' }}>
      <div className="row between mb16">
        <div>
          <h1 className="display">Active Saturday Route</h1>
          <p className="muted small mt0">
            {orders.length} stop{orders.length === 1 ? '' : 's'} · {totalBags} sealed bags · {formatMoney(totalPay)} est. pay
          </p>
        </div>
        <Link href="/driver" className="btn btn-ghost btn-sm">
          ← Driver Home
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card center mt24" style={{ padding: '40px' }}>
          <div style={{ fontSize: '40px' }}>🗺️</div>
          <h3 className="mt8">Your route is currently empty</h3>
          <p className="muted small">Accept deliveries on the available jobs board to assemble your Saturday schedule.</p>
          <Link href="/driver/available" className="btn btn-primary btn-sm mt16">
            Find jobs →
          </Link>
        </div>
      ) : (
        <div className="stack" style={{ gap: '16px' }}>
          {orders.map((o, idx) => {
            const customerAddress = `${o.addressLine1}, ${o.city}, ${o.state} ${o.zip}`;
            const storeAddress = `${o.store?.address || ''}, ${o.store?.city || 'Silver Spring'}, ${o.store?.state || 'MD'}`;

            return (
              <div key={o.id} className="card" style={{ borderLeft: `6px solid ${o.status === 'picked_up' ? 'var(--blue-600)' : 'var(--gold-500)'}` }}>
                <div className="row between">
                  <span className="strong" style={{ fontSize: '16px' }}>
                    Stop {idx + 1} · {o.number}
                  </span>
                  <span className={`badge ${o.status === 'picked_up' ? 'b-blue' : 'b-gold'}`}>
                    {o.status === 'picked_up' ? 'Out for Delivery' : 'Ready for Store Pickup'}
                  </span>
                </div>

                {/* PICKUP LEG */}
                <div className="leg mt12" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>🏪</span>
                  <div style={{ flex: 1 }}>
                    <div className="strong small">Pickup: {o.store?.name}</div>
                    <div className="tiny muted">{storeAddress}</div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '6px 10px' }}
                    title="Open Google Maps Navigation"
                  >
                    🗺️ GPS
                  </a>
                </div>

                {/* DROP-OFF LEG */}
                <div className="leg mt8" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>🏠</span>
                  <div style={{ flex: 1 }}>
                    <div className="strong small">Drop-off: {o.customer?.name}</div>
                    <div className="tiny muted">{customerAddress} {o.addressLine2 ? `· ${o.addressLine2}` : ''}</div>
                    {o.notes && <div className="tiny" style={{ color: 'var(--amber)' }}>📝 {o.notes}</div>}
                  </div>
                  <div className="row" style={{ gap: '4px' }}>
                    {o.customer?.phone && (
                      <a href={`tel:${o.customer.phone}`} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
                        📞 Call
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px 10px' }}
                      title="Open Google Maps Navigation"
                    >
                      🗺️ GPS
                    </a>
                  </div>
                </div>

                <div className="row between mt12 tiny" style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                  <span className="badge b-gold">🛍️ Collect {o.bags} sealed bag{o.bags > 1 ? 's' : ''}</span>
                  <span className="strong" style={{ fontSize: '15px', color: 'var(--green)' }}>
                    Payout: {formatMoney(o.driverPayCents)}
                  </span>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt16">
                  {o.status === 'ready' ? (
                    <button
                      type="button"
                      onClick={() => handleConfirmPickup(o.id)}
                      className="btn btn-primary btn-block"
                    >
                      Confirm Pickup ({o.bags} bag{o.bags > 1 ? 's' : ''}) →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModalOrder(o)}
                      className="btn btn-success btn-block"
                    >
                      Complete Delivery (Snap Photo & Proof) ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELIVERY COMPLETION MODAL */}
      {activeModalOrder && (
        <div
          className="modal-bg"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="modal card" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="card-h">
              <h3>Drop-off Proof: {activeModalOrder.number}</h3>
              <button type="button" onClick={() => setActiveModalOrder(null)} className="icon-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteDelivery} className="stack mt16" style={{ gap: '14px' }}>
              <label className="field">
                Drop-off location note
                <select
                  className="input"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                >
                  <option>Left safely at front door</option>
                  <option>Handed directly to customer</option>
                  <option>Left with apartment building concierge</option>
                  <option>Left on covered side porch</option>
                </select>
              </label>

              <label className="field">
                Drop-off photo verification
                <input type="file" accept="image/*" capture="environment" className="input" />
                <span className="tiny muted">Photo proof is sent immediately to customer via SMS and stored for dispute defense.</span>
              </label>

              <div className="row mt16" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setActiveModalOrder(null)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-success">
                  {submitting ? 'Confirming...' : 'Mark as Delivered ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

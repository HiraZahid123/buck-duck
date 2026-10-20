'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney, formatDate, formatTime } from '../../../lib/api';

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'accepted', label: 'Store Accepted' },
  { key: 'packing', label: 'Packing in Bags' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'picked_up', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id;
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && orderId) {
      apiRequest('GET', `/api/orders/${orderId}`, null, token)
        .then((res) => setOrder(res.order))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="container section center" style={{ padding: '60px' }}>
        <div className="loader">Loading order status...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container section center" style={{ padding: '60px' }}>
        <h2>Order Not Found</h2>
        <p className="muted small">{error || 'Please make sure you are signed in with the correct account.'}</p>
        <Link href="/account" className="btn btn-primary mt16">
          Back to my orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="container section">
      <div className="row between mb16">
        <div>
          <div className="row" style={{ gap: '10px' }}>
            <h1 className="display mb0">Order {order.number}</h1>
            <span className="badge b-gold">{order.status}</span>
          </div>
          <p className="muted small mt4">
            From <b>{order.store?.name}</b> · Destination: {order.addressLine1}, {order.city}, {order.state} {order.zip}
          </p>
        </div>
        <Link href="/account" className="btn btn-ghost btn-sm">
          ← Back to orders
        </Link>
      </div>

      {/* TRACKING PROGRESS BAR */}
      <div className="card mb24">
        <h3 className="mb16">Delivery Status</h3>
        <div className="row between wrap" style={{ gap: '12px', borderTop: '2px solid var(--line)', paddingTop: '16px' }}>
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.key} className="center" style={{ flex: 1, minWidth: '90px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--navy-900)' : '#E2E8F0',
                    color: isCompleted ? '#fff' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px auto',
                    fontWeight: 700,
                    boxShadow: isCurrent ? '0 0 0 4px var(--blue-100)' : 'none',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div
                  className="tiny strong"
                  style={{ color: isCompleted ? 'var(--navy-900)' : 'var(--ink-3)' }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {order.proofNote && (
          <div className="alert mt16 small" style={{ background: 'var(--green-bg)', color: 'var(--green)', padding: '12px', borderRadius: '8px' }}>
            🎉 <b>Driver Drop-off Confirmation:</b> {order.proofNote}
          </div>
        )}
      </div>

      <div className="grid g3" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* ORDER ITEMS */}
        <div className="card">
          <h3>Packed Items ({order.items?.length || 0})</h3>
          <div className="stack mt16" style={{ gap: '10px' }}>
            {(order.items || []).map((it: any) => (
              <div key={it.id} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="row" style={{ gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{it.emoji || '🛒'}</span>
                  <div>
                    <b>{it.name}</b>
                    <div className="tiny muted">{it.unit}</div>
                  </div>
                </div>
                <div>
                  <span className="muted small" style={{ marginRight: '16px' }}>Qty: {it.qty}</span>
                  <b>{formatMoney(it.priceCents * it.qty)}</b>
                </div>
              </div>
            ))}
          </div>

          {/* TIMELINE EVENTS */}
          <h4 className="mt24 mb12">Order Activity Timeline</h4>
          <div className="stack tiny" style={{ gap: '8px' }}>
            {(order.events || []).map((ev: any) => (
              <div key={ev.id} className="row" style={{ gap: '10px' }}>
                <span className="badge b-blue">{ev.status}</span>
                <span className="muted">{new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:</span>
                <span>{ev.note || `Status marked as ${ev.status}`} ({ev.actor})</span>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="card">
          <h3>Payment & Window</h3>
          <div className="stack small mt16" style={{ gap: '10px' }}>
            <div>
              <span className="muted">Delivery Window:</span>
              <div className="strong mt4">{order.window?.date} · {order.window?.label}</div>
            </div>
            <div>
              <span className="muted">Assigned Driver:</span>
              <div className="strong mt4">{order.driver?.name || 'Assigned Saturday morning'}</div>
            </div>
            <div>
              <span className="muted">Sealed BuckDuck Bags:</span>
              <div className="strong mt4">{order.bags} bag{order.bags > 1 ? 's' : ''}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <div className="row between">
                <span className="muted">Merchandise Subtotal</span>
                <span>{formatMoney(order.subtotalCents)}</span>
              </div>
              <div className="row between mt4">
                <span className="muted">Delivery Fee</span>
                <span>{formatMoney(order.deliveryFeeCents)}</span>
              </div>
              <div className="row between mt4">
                <span className="muted">Service Fee</span>
                <span>{formatMoney(order.serviceFeeCents)}</span>
              </div>
              <div className="row between mt4">
                <span className="muted">Driver Tip</span>
                <span>{formatMoney(order.tipCents)}</span>
              </div>
              <div className="row between mt12 strong" style={{ fontSize: '16px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                <span>Total Paid</span>
                <span>{formatMoney(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

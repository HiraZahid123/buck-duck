'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, formatMoney, formatDate, formatTime } from '../../lib/api';

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  placed: { label: 'New order', badgeClass: 'b-blue' },
  accepted: { label: 'Accepted by store', badgeClass: 'b-purple' },
  packing: { label: 'Packing in bags', badgeClass: 'b-amber' },
  ready: { label: 'Ready for pickup', badgeClass: 'b-gold' },
  picked_up: { label: 'Out for delivery', badgeClass: 'b-blue' },
  delivered: { label: 'Delivered', badgeClass: 'b-green' },
  cancelled: { label: 'Cancelled', badgeClass: 'b-red' },
  refunded: { label: 'Refunded', badgeClass: 'b-gray' },
};

export default function AccountPage() {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiRequest('GET', '/api/orders', null, token)
        .then((res) => setOrders(res.orders || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? You will receive a 100% full refund to your original payment method.')) {
      return;
    }
    try {
      await apiRequest('POST', `/api/orders/${orderId}/cancel`, null, token);
      const res = await apiRequest('GET', '/api/orders', null, token);
      setOrders(res.orders || []);
      alert('Order cancelled and full refund issued.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  if (!user) {
    return (
      <div className="container section center" style={{ padding: '80px 20px' }}>
        <h2 className="display">Sign in to view your orders</h2>
        <p className="muted small">Or use the 1-click &ldquo;🛒 Shopper&rdquo; button in the bottom demo bar.</p>
        <div className="row mt24" style={{ justifyContent: 'center', gap: '12px' }}>
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="row between mb24">
        <div>
          <h1 className="display">My Account & Orders</h1>
          <p className="muted small mt0">
            Welcome back, <b>{user.name}</b> ({user.email}) · Pilot Launch Zone: Silver Spring, MD
          </p>
        </div>
        <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
          Sign out
        </button>
      </div>

      <div className="grid g3" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* PROFILE CARD */}
        <div className="card">
          <h3>Customer Profile</h3>
          <div className="stack small mt16" style={{ gap: '10px' }}>
            <div>
              <span className="muted">Name:</span> <b>{user.name}</b>
            </div>
            <div>
              <span className="muted">Email:</span> <b>{user.email}</b>
            </div>
            <div>
              <span className="muted">Phone:</span> <b>{user.phone || 'Not provided'}</b>
            </div>
            <div>
              <span className="muted">Role:</span> <span className="badge b-gold">{user.role}</span>
            </div>
          </div>
          <div className="mt24">
            <Link href="/stores" className="btn btn-primary btn-sm btn-block">
              + New Saturday Order
            </Link>
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="stack" style={{ gap: '16px' }}>
          <h3>Order History ({orders.length})</h3>

          {orders.length === 0 ? (
            <div className="card center" style={{ padding: '40px' }}>
              <div style={{ fontSize: '36px' }}>📦</div>
              <h4 className="mt8">No orders yet</h4>
              <p className="muted small">Your Saturday delivery orders will appear here once placed.</p>
            </div>
          ) : (
            orders.map((o) => {
              const st = STATUS_LABELS[o.status] || { label: o.status, badgeClass: 'b-gray' };
              const canCancel = o.status === 'placed';

              return (
                <div key={o.id} className="card">
                  <div className="row between">
                    <div>
                      <span className="strong" style={{ fontSize: '16px' }}>
                        {o.number}
                      </span>
                      <span className="muted small" style={{ marginLeft: '10px' }}>
                        {o.store?.name}
                      </span>
                    </div>
                    <span className={`badge ${st.badgeClass}`}>{st.label}</span>
                  </div>

                  <div className="row between mt12 tiny muted" style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                    <div>
                      <span>📅 {o.window ? `${o.window.date} · ${o.window.label}` : 'Saturday delivery'}</span>
                      <span style={{ marginLeft: '12px' }}>🛍️ {o.item_count} items</span>
                    </div>
                    <span className="strong" style={{ fontSize: '15px', color: 'var(--navy-900)' }}>
                      {formatMoney(o.totalCents || o.total_cents)}
                    </span>
                  </div>

                  <div className="row between mt12">
                    <Link href={`/orders/${o.id}`} className="btn btn-ghost btn-sm">
                      View details & tracking →
                    </Link>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(o.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Cancel order (100% refund)
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, formatMoney } from '../../lib/api';
import { playOrderChime } from '../../lib/chime';

export default function MerchantDashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadData = async () => {
    if (!token) return;
    try {
      const [sumRes, ordersRes] = await Promise.all([
        apiRequest('GET', '/api/merchant/summary', null, token),
        apiRequest('GET', '/api/merchant/orders', null, token),
      ]);
      setSummary(sumRes);
      setOrders(ordersRes.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll for new orders every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleUpdateStatus = async (orderId: number, nextStatus: string, bags = 1) => {
    setUpdatingId(orderId);
    try {
      await apiRequest(
        'POST',
        `/api/merchant/orders/${orderId}/status`,
        { status: nextStatus, bags },
        token,
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || user.role !== 'merchant') {
    return (
      <div className="container section center" style={{ padding: '80px 20px' }}>
        <h2>Merchant Portal Access</h2>
        <p className="muted small">Please sign in as a partner store owner or click &ldquo;🏪 Merchant&rdquo; in the demo bar below.</p>
        <Link href="/login" className="btn btn-primary mt16">
          Sign in
        </Link>
      </div>
    );
  }

  const placedOrders = orders.filter((o) => o.status === 'placed');
  const acceptedOrders = orders.filter((o) => o.status === 'accepted');
  const packingOrders = orders.filter((o) => o.status === 'packing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div className="container section">
      {/* HEADER & CHIME TEST */}
      <div className="row between mb24 wrap">
        <div>
          <div className="row" style={{ gap: '10px' }}>
            <span style={{ fontSize: '32px' }}>{summary?.store?.emoji || '🏪'}</span>
            <div>
              <h1 className="display mb0">{summary?.store?.name || 'Merchant Portal'}</h1>
              <div className="tiny muted">
                {summary?.store?.category} · {summary?.store?.address}, Silver Spring, MD · Status: <span className="badge b-gold">{summary?.store?.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row wrap" style={{ gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              playOrderChime();
              alert('🔔 Kitchen chime sound played! Tablets emit this sound whenever a new customer order arrives.');
            }}
            className="btn btn-ghost btn-sm"
          >
            🔔 Test Kitchen Chime
          </button>
          <Link href="/merchant/products" className="btn btn-ghost btn-sm">
            Catalog & Stock
          </Link>
          <Link href="/merchant/payouts" className="btn btn-ghost btn-sm">
            Stripe Payouts
          </Link>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid g4 mb24">
        <div className="card kpi">
          <div className="lbl">Active Pipeline</div>
          <div className="val">{placedOrders.length + acceptedOrders.length + packingOrders.length + readyOrders.length}</div>
          <div className="sub">{placedOrders.length} new orders awaiting acceptance</div>
        </div>

        <div className="card kpi">
          <div className="lbl">BuckDuck Bags Needed</div>
          <div className="val" style={{ color: 'var(--amber)' }}>
            🛍️ {summary?.bags_needed || 0}
          </div>
          <div className="sub">Have bags ready by Saturday 5 AM</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Delivered Sales</div>
          <div className="val" style={{ color: 'var(--green)' }}>
            {formatMoney(summary?.totals?.sales || 0)}
          </div>
          <div className="sub">{summary?.totals?.orders || 0} completed deliveries</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Net Store Payout</div>
          <div className="val" style={{ color: 'var(--navy-900)' }}>
            {formatMoney(summary?.totals?.payout || 0)}
          </div>
          <div className="sub">After 15% platform commission</div>
        </div>
      </div>

      {/* KANBAN PACKING PIPELINE */}
      <div className="row between mb12">
        <h3 className="mb0">Saturday Order Pipeline (Kanban)</h3>
        <span className="tiny muted">Auto-refreshes every 10s · Step-by-step order workflow</span>
      </div>

      <div className="grid g4" style={{ alignItems: 'flex-start' }}>
        {/* COL 1: NEW / PLACED */}
        <div className="card flat" style={{ background: 'var(--surface-2)', padding: '14px' }}>
          <div className="row between mb12">
            <b>1. New ({placedOrders.length})</b>
            <span className="badge b-blue">Paid</span>
          </div>

          <div className="stack" style={{ gap: '10px' }}>
            {placedOrders.map((o) => (
              <div key={o.id} className="card" style={{ padding: '12px' }}>
                <div className="row between">
                  <b>{o.number}</b>
                  <span className="tiny strong">{formatMoney(o.subtotalCents)}</span>
                </div>
                <div className="tiny muted mt4">
                  Customer: {o.customer?.name} ({o.customer?.phone})
                </div>
                <div className="tiny mt4">🛍️ {o.item_count} items · ~{o.bags} bags</div>
                <div className="mt12">
                  <button
                    type="button"
                    disabled={updatingId === o.id}
                    onClick={() => handleUpdateStatus(o.id, 'accepted')}
                    className="btn btn-primary btn-sm btn-block"
                  >
                    Accept Order ✓
                  </button>
                </div>
              </div>
            ))}
            {placedOrders.length === 0 && <div className="tiny muted center py16">No new orders</div>}
          </div>
        </div>

        {/* COL 2: ACCEPTED */}
        <div className="card flat" style={{ background: 'var(--surface-2)', padding: '14px' }}>
          <div className="row between mb12">
            <b>2. Accepted ({acceptedOrders.length})</b>
            <span className="badge b-purple">To Pack</span>
          </div>

          <div className="stack" style={{ gap: '10px' }}>
            {acceptedOrders.map((o) => (
              <div key={o.id} className="card" style={{ padding: '12px' }}>
                <div className="row between">
                  <b>{o.number}</b>
                  <span className="tiny strong">{formatMoney(o.subtotalCents)}</span>
                </div>
                <div className="tiny mt4">🛍️ {o.item_count} items</div>
                <div className="mt12">
                  <button
                    type="button"
                    disabled={updatingId === o.id}
                    onClick={() => handleUpdateStatus(o.id, 'packing')}
                    className="btn btn-blue btn-sm btn-block"
                  >
                    Start Packing →
                  </button>
                </div>
              </div>
            ))}
            {acceptedOrders.length === 0 && <div className="tiny muted center py16">No accepted orders</div>}
          </div>
        </div>

        {/* COL 3: PACKING */}
        <div className="card flat" style={{ background: 'var(--surface-2)', padding: '14px' }}>
          <div className="row between mb12">
            <b>3. Packing ({packingOrders.length})</b>
            <span className="badge b-amber">Sealing</span>
          </div>

          <div className="stack" style={{ gap: '10px' }}>
            {packingOrders.map((o) => (
              <div key={o.id} className="card" style={{ padding: '12px' }}>
                <div className="row between">
                  <b>{o.number}</b>
                  <span className="tiny strong">{formatMoney(o.subtotalCents)}</span>
                </div>
                <div className="tiny mt4">Items: {o.items?.map((i: any) => `${i.qty}x ${i.name}`).join(', ')}</div>
                <div className="mt12">
                  <button
                    type="button"
                    disabled={updatingId === o.id}
                    onClick={() => {
                      const count = prompt('Confirm number of sealed BuckDuck bags packed for this order:', String(o.bags || 1));
                      if (count) {
                        handleUpdateStatus(o.id, 'ready', parseInt(count, 10) || 1);
                      }
                    }}
                    className="btn btn-gold btn-sm btn-block"
                  >
                    Mark Ready for Pickup ✓
                  </button>
                </div>
              </div>
            ))}
            {packingOrders.length === 0 && <div className="tiny muted center py16">No orders being packed</div>}
          </div>
        </div>

        {/* COL 4: READY */}
        <div className="card flat" style={{ background: 'var(--surface-2)', padding: '14px' }}>
          <div className="row between mb12">
            <b>4. Ready ({readyOrders.length})</b>
            <span className="badge b-gold">Awaiting Driver</span>
          </div>

          <div className="stack" style={{ gap: '10px' }}>
            {readyOrders.map((o) => (
              <div key={o.id} className="card" style={{ padding: '12px' }}>
                <div className="row between">
                  <b>{o.number}</b>
                  <span className="badge b-green">✓ Sealed</span>
                </div>
                <div className="tiny strong mt4" style={{ color: 'var(--navy-900)' }}>
                  🛍️ {o.bags} BuckDuck bag{o.bags > 1 ? 's' : ''}
                </div>
                <div className="tiny muted mt4">
                  {o.driverId ? `Driver assigned` : 'Waiting for driver pickup'}
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && <div className="tiny muted center py16">No ready orders</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

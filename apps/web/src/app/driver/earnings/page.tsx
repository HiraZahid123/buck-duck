'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney, formatDate } from '../../../lib/api';

export default function DriverEarningsPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      Promise.all([
        apiRequest('GET', '/api/driver/history', null, token),
        apiRequest('GET', '/api/driver/summary', null, token),
      ])
        .then(([histRes, sumRes]) => {
          setOrders(histRes.orders || []);
          setSummary(sumRes);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

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
          <h1 className="display">Driver Earnings</h1>
          <p className="muted small mt0">Direct deposit paid weekly every Tuesday</p>
        </div>
        <Link href="/driver" className="btn btn-ghost btn-sm">
          ← Driver Home
        </Link>
      </div>

      <div className="card mb16" style={{ background: 'var(--navy-900)', color: '#fff', textAlign: 'center', padding: '32px' }}>
        <div className="tiny" style={{ color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Total Career Earnings
        </div>
        <div className="display mt8" style={{ fontSize: '42px', color: '#fff' }}>
          {formatMoney(summary?.totals?.earnings || 0)}
        </div>
        <div className="tiny mt8" style={{ opacity: 0.8 }}>
          {summary?.totals?.deliveries || 0} Saturday deliveries · {formatMoney(summary?.totals?.tips || 0)} customer tips
        </div>
      </div>

      <div className="card pad0">
        <div className="card-h" style={{ padding: '16px 20px', margin: 0 }}>
          <h3 style={{ margin: 0 }}>Recent Completed Deliveries</h3>
        </div>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '12px 16px' }}>Order #</th>
              <th style={{ padding: '12px 16px' }}>Store</th>
              <th style={{ padding: '12px 16px' }}>Base Pay</th>
              <th style={{ padding: '12px 16px' }}>Tip</th>
              <th style={{ padding: '12px 16px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <b>{o.number}</b>
                </td>
                <td style={{ padding: '12px 16px' }} className="muted small">
                  {o.store?.name}
                </td>
                <td style={{ padding: '12px 16px' }}>$5.50</td>
                <td className="strong" style={{ padding: '12px 16px', color: 'var(--green)' }}>
                  {formatMoney(o.tipCents)}
                </td>
                <td className="strong" style={{ padding: '12px 16px', color: 'var(--navy-900)' }}>
                  {formatMoney(o.driverPayCents)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="center muted" style={{ padding: '32px' }}>
                  No completed deliveries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

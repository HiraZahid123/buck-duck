'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney, formatDate } from '../../../lib/api';

export default function MerchantPayoutsPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadPayouts = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('GET', '/api/merchant/payouts', null, token);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [token]);

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const res = await apiRequest('POST', '/api/merchant/stripe/onboard', null, token);
      if (res.url) {
        window.location.href = res.url;
      } else {
        alert('Stripe Connect account linked! Bank transfers will occur automatically upon Saturday delivery.');
        await loadPayouts();
      }
    } catch (err: any) {
      alert(err.message || 'Stripe onboarding failed');
    } finally {
      setConnecting(false);
    }
  };

  if (!user || user.role !== 'merchant') {
    return (
      <div className="container section center">
        <h2>Merchant Portal</h2>
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
          <h1 className="display">Direct Bank Payouts</h1>
          <p className="muted small mt0">
            Powered by Stripe Connect Express · Automatic direct deposit upon driver delivery confirmation
          </p>
        </div>
        <Link href="/merchant" className="btn btn-ghost btn-sm">
          ← Order Kanban
        </Link>
      </div>

      <div className="grid g3 mb24">
        <div className="card kpi">
          <div className="lbl">Pending Saturday Payout</div>
          <div className="val" style={{ color: 'var(--amber)' }}>
            {formatMoney(data?.pending_cents || 0)}
          </div>
          <div className="sub">Transferred upon driver drop-off confirmation</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Platform Commission</div>
          <div className="val">{Math.round((data?.store?.commission_rate || 0.15) * 100)}%</div>
          <div className="sub">Protected merchant payout rate</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Stripe Status</div>
          <div className="val" style={{ fontSize: '20px', marginTop: '10px' }}>
            {data?.store?.stripe_charges_enabled ? (
              <span className="badge b-green">✓ Bank Linked</span>
            ) : (
              <span className="badge b-gold">Demo Simulated</span>
            )}
          </div>
          <div className="sub">Mode: {data?.payments_mode || 'demo'}</div>
        </div>
      </div>

      {/* STRIPE CONNECT BANNER */}
      <div className="card mb24" style={{ background: 'var(--surface-2)' }}>
        <div className="row between wrap">
          <div>
            <h3>Stripe Express Account</h3>
            <p className="small muted mt4">
              Connect your US business checking account to receive automatic transfers every Saturday.
            </p>
          </div>
          <button
            type="button"
            disabled={connecting}
            onClick={handleConnectStripe}
            className="btn btn-primary"
          >
            {connecting ? 'Connecting...' : 'Connect with Stripe →'}
          </button>
        </div>
      </div>

      {/* PAYOUT HISTORY TABLE */}
      <div className="card pad0">
        <div className="card-h" style={{ padding: '16px 20px', margin: 0 }}>
          <h3 style={{ margin: 0 }}>Delivered Order Transfers</h3>
        </div>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '12px 16px' }}>Order #</th>
              <th style={{ padding: '12px 16px' }}>Delivery Date</th>
              <th style={{ padding: '12px 16px' }}>Gross Sales</th>
              <th style={{ padding: '12px 16px' }}>Commission (15%)</th>
              <th style={{ padding: '12px 16px' }}>Net Store Payout</th>
              <th style={{ padding: '12px 16px' }}>Transfer Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.orders || []).map((o: any) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <b>{o.number}</b>
                </td>
                <td style={{ padding: '12px 16px' }} className="muted small">
                  {formatDate(o.createdAt)}
                </td>
                <td style={{ padding: '12px 16px' }}>{formatMoney(o.subtotalCents)}</td>
                <td style={{ padding: '12px 16px' }} className="muted">
                  -{formatMoney(o.commissionCents)}
                </td>
                <td className="strong" style={{ padding: '12px 16px', color: 'var(--green)' }}>
                  {formatMoney(o.subtotalCents - o.commissionCents)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge b-green">✓ Transferred</span>
                </td>
              </tr>
            ))}
            {(data?.orders || []).length === 0 && (
              <tr>
                <td colSpan={6} className="center muted" style={{ padding: '32px' }}>
                  No delivered orders yet. Orders are settled automatically upon delivery.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, formatMoney } from '../../lib/api';

export default function AdminOverviewPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiRequest('GET', '/api/admin/overview', null, token)
        .then((res) => setData(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container section center" style={{ padding: '80px 20px' }}>
        <h2>Admin Console Access</h2>
        <p className="muted small">Please sign in as an admin or click &ldquo;🛡️ Admin&rdquo; in the demo bar below.</p>
        <Link href="/login" className="btn btn-primary mt16">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="row between mb24 wrap">
        <div>
          <div className="row" style={{ gap: '10px' }}>
            <span style={{ fontSize: '32px' }}>🛡️</span>
            <div>
              <h1 className="display mb0">Operations Command Center</h1>
              <div className="tiny muted">
                BuckDuck Marketplace · Pilot Region: Silver Spring, MD (Eastern Time)
              </div>
            </div>
          </div>
        </div>

        <div className="row wrap" style={{ gap: '10px' }}>
          <Link href="/admin/orders" className="btn btn-primary btn-sm">
            Live Dispatch Board
          </Link>
          <Link href="/admin/stores" className="btn btn-ghost btn-sm">
            Store Approvals
          </Link>
          <Link href="/admin/finance" className="btn btn-ghost btn-sm">
            Finance & Ledger
          </Link>
        </div>
      </div>

      {/* EXECUTIVE FINANCIAL KPIS */}
      <div className="grid g4 mb24">
        <div className="card kpi">
          <div className="lbl">Gross Merchandise Volume</div>
          <div className="val" style={{ color: 'var(--navy-900)' }}>
            {formatMoney(data?.totals?.gmv || 0)}
          </div>
          <div className="sub">{data?.totals?.orders || 0} active & delivered orders</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Net Platform Revenue</div>
          <div className="val" style={{ color: 'var(--green)' }}>
            {formatMoney(data?.totals?.net_revenue || 0)}
          </div>
          <div className="sub">Commissions + Delivery & Service fees − Driver Pay</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Average Order Value</div>
          <div className="val" style={{ color: 'var(--blue-600)' }}>
            {formatMoney(data?.totals?.aov || 0)}
          </div>
          <div className="sub">Consolidated weekly Saturday basket</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Unassigned Ready Jobs</div>
          <div className="val" style={{ color: data?.counts?.unassigned_ready ? 'var(--red)' : 'var(--ink-3)' }}>
            {data?.counts?.unassigned_ready || 0}
          </div>
          <div className="sub">Orders packed & awaiting driver pickup</div>
        </div>
      </div>

      {/* PLATFORM OPERATIONS COUNTS */}
      <div className="grid g4 mb24">
        <div className="card">
          <div className="tiny muted">Active Stores</div>
          <div className="strong" style={{ fontSize: '24px', marginTop: '6px' }}>
            {data?.counts?.stores || 0}
          </div>
          <div className="tiny muted mt4">{data?.counts?.pending_stores || 0} pending review</div>
        </div>

        <div className="card">
          <div className="tiny muted">Online Drivers</div>
          <div className="strong" style={{ fontSize: '24px', marginTop: '6px' }}>
            {data?.counts?.drivers_online || 0} / {data?.counts?.drivers || 0}
          </div>
          <div className="tiny muted mt4">Available for Saturday dispatch</div>
        </div>

        <div className="card">
          <div className="tiny muted">Registered Shoppers</div>
          <div className="strong" style={{ fontSize: '24px', marginTop: '6px' }}>
            {data?.counts?.customers || 0}
          </div>
          <div className="tiny muted mt4">Montgomery County, MD corridor</div>
        </div>

        <div className="card">
          <div className="tiny muted">Saturday Cutoff</div>
          <div className="strong" style={{ fontSize: '24px', marginTop: '6px' }}>
            24 Hours
          </div>
          <div className="tiny muted mt4">Friday lock before delivery</div>
        </div>
      </div>

      {/* PIPELINE BREAKDOWN TABLE */}
      <div className="card pad0">
        <div className="card-h" style={{ padding: '16px 20px', margin: 0 }}>
          <h3 style={{ margin: 0 }}>Live Pipeline Status</h3>
        </div>
        <div className="grid g4 p16" style={{ padding: '20px' }}>
          <div className="card flat center" style={{ background: 'var(--blue-50)' }}>
            <div className="tiny strong muted">New (Paid)</div>
            <div className="val" style={{ fontSize: '28px', fontWeight: 800 }}>{data?.statuses?.placed || 0}</div>
          </div>
          <div className="card flat center" style={{ background: 'var(--purple-bg)' }}>
            <div className="tiny strong muted">Accepted by Stores</div>
            <div className="val" style={{ fontSize: '28px', fontWeight: 800 }}>{data?.statuses?.accepted || 0}</div>
          </div>
          <div className="card flat center" style={{ background: 'var(--amber-bg)' }}>
            <div className="tiny strong muted">Packing in Bags</div>
            <div className="val" style={{ fontSize: '28px', fontWeight: 800 }}>{data?.statuses?.packing || 0}</div>
          </div>
          <div className="card flat center" style={{ background: 'var(--gold-50)' }}>
            <div className="tiny strong muted">Ready for Drivers</div>
            <div className="val" style={{ fontSize: '28px', fontWeight: 800 }}>{data?.statuses?.ready || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

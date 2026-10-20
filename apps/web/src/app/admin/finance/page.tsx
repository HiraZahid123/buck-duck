'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest, formatMoney } from '../../../lib/api';

export default function AdminFinancePage() {
  const { user, token } = useAuth();
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiRequest('GET', '/api/admin/finance', null, token)
        .then((res) => setFinance(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

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

  const totals = finance?.totals || {};

  return (
    <div className="container section">
      <div className="row between mb24">
        <div>
          <h1 className="display">Financial Reconciliation Ledger</h1>
          <p className="muted small mt0">
            Marketplace gross volume, merchant disbursements, driver compensation, and platform net revenue.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost btn-sm">
          ← Overview
        </Link>
      </div>

      <div className="grid g4 mb24">
        <div className="card kpi">
          <div className="lbl">Gross Merchandise Volume</div>
          <div className="val" style={{ color: 'var(--navy-900)' }}>
            {formatMoney(totals.gmv || 0)}
          </div>
          <div className="sub">{finance?.delivered_count || 0} settled orders</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Net Platform Revenue</div>
          <div className="val" style={{ color: 'var(--green)' }}>
            {formatMoney(totals.net_revenue || 0)}
          </div>
          <div className="sub">BuckDuck retained margin</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Store Disbursements</div>
          <div className="val">{formatMoney(totals.merchant_payouts || 0)}</div>
          <div className="sub">Paid directly via Stripe Connect</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Driver Compensation</div>
          <div className="val" style={{ color: 'var(--blue-600)' }}>
            {formatMoney(totals.driver_pay || 0)}
          </div>
          <div className="sub">Base pay + 100% customer tips</div>
        </div>
      </div>

      {/* LINE ITEM RECONCILIATION CARD */}
      <div className="card">
        <h3>Revenue & Cost Line-Item Breakdown</h3>
        <div className="stack mt16" style={{ gap: '14px' }}>
          <div className="row between">
            <span>Customer Merchandise Spend</span>
            <b>{formatMoney(totals.merchandise || 0)}</b>
          </div>
          <div className="row between" style={{ color: 'var(--green)' }}>
            <span>+ Platform Commissions Retained (15% avg)</span>
            <b>+{formatMoney(totals.commissions || 0)}</b>
          </div>
          <div className="row between" style={{ color: 'var(--blue-600)' }}>
            <span>+ Customer Delivery Fees ($5.99 / store)</span>
            <b>+{formatMoney(totals.delivery_fees || 0)}</b>
          </div>
          <div className="row between" style={{ color: 'var(--blue-600)' }}>
            <span>+ Customer Service Fees (5%, min $1.99)</span>
            <b>+{formatMoney(totals.service_fees || 0)}</b>
          </div>
          <div className="row between" style={{ color: 'var(--red)', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
            <span>− Driver Delivery Pay Disbursed</span>
            <b>−{formatMoney(totals.driver_pay || 0)}</b>
          </div>
          <div className="row between strong mt12" style={{ fontSize: '18px', borderTop: '2px solid var(--line)', paddingTop: '12px' }}>
            <span>Platform Contribution Margin</span>
            <span style={{ color: 'var(--green)' }}>{formatMoney(totals.net_revenue || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

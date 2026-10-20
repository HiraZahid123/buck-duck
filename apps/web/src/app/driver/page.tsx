'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, formatMoney } from '../../lib/api';

export default function DriverDashboardPage() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loadSummary = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('GET', '/api/driver/summary', null, token);
      setSummary(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [token]);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const next = !summary?.driver?.online;
      await apiRequest('POST', '/api/driver/online', { online: next }, token);
      await loadSummary();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setToggling(false);
    }
  };

  if (!user || user.role !== 'driver') {
    return (
      <div className="container section center" style={{ padding: '80px 20px' }}>
        <h2>Driver Portal Access</h2>
        <p className="muted small">Please sign in as a driver or click &ldquo;🚚 Driver&rdquo; in the demo bar below.</p>
        <Link href="/login" className="btn btn-primary mt16">
          Sign in
        </Link>
      </div>
    );
  }

  const isOnline = Boolean(summary?.driver?.online);

  return (
    <div className="container section" style={{ maxWidth: '600px' }}>
      {/* DRIVER HEADER */}
      <div className="card mb16" style={{ background: 'var(--navy-900)', color: '#fff' }}>
        <div className="row between">
          <div>
            <div className="tiny" style={{ color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              BuckDuck Driver App
            </div>
            <h2 className="display mt4 mb0" style={{ color: '#fff' }}>
              {user.name}
            </h2>
            <div className="tiny" style={{ opacity: 0.8, marginTop: '4px' }}>
              Vehicle: {summary?.driver?.vehicle || 'Registered vehicle'} · Silver Spring, MD
            </div>
          </div>

          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleOnline}
            className={`btn ${isOnline ? 'btn-gold' : 'btn-ghost'}`}
            style={{ color: isOnline ? 'var(--navy-950)' : '#fff', borderColor: '#fff' }}
          >
            {isOnline ? '● You are Online' : '○ Go Online'}
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid g2 mb16">
        <div className="card kpi">
          <div className="lbl">Active Route Stops</div>
          <div className="val" style={{ color: 'var(--blue-600)' }}>
            {summary?.active || 0} / 12
          </div>
          <div className="sub">Max 12 stops per Saturday shift</div>
        </div>

        <div className="card kpi">
          <div className="lbl">Available Deliveries</div>
          <div className="val" style={{ color: 'var(--amber)' }}>
            {summary?.available || 0}
          </div>
          <div className="sub">Ready for pickup at stores</div>
        </div>
      </div>

      {/* ACTION NAVIGATION CARDS */}
      <div className="stack" style={{ gap: '12px' }}>
        <Link href="/driver/available" className="card row between" style={{ padding: '18px' }}>
          <div className="row" style={{ gap: '14px' }}>
            <span style={{ fontSize: '32px' }}>📦</span>
            <div>
              <b>Available Job Board ({summary?.available || 0})</b>
              <div className="tiny muted">Browse ready bags and claim delivery routes</div>
            </div>
          </div>
          <span className="strong" style={{ color: 'var(--blue-700)' }}>View jobs →</span>
        </Link>

        <Link href="/driver/route" className="card row between" style={{ padding: '18px' }}>
          <div className="row" style={{ gap: '14px' }}>
            <span style={{ fontSize: '32px' }}>🗺️</span>
            <div>
              <b>My Active Route ({summary?.active || 0} stops)</b>
              <div className="tiny muted">Turn-by-turn Google Maps & drop-off photo proof</div>
            </div>
          </div>
          <span className="strong" style={{ color: 'var(--blue-700)' }}>Open route →</span>
        </Link>

        <Link href="/driver/earnings" className="card row between" style={{ padding: '18px' }}>
          <div className="row" style={{ gap: '14px' }}>
            <span style={{ fontSize: '32px' }}>💵</span>
            <div>
              <b>Weekly Earnings ({formatMoney(summary?.totals?.earnings || 0)})</b>
              <div className="tiny muted">
                {summary?.totals?.deliveries || 0} deliveries · {formatMoney(summary?.totals?.tips || 0)} customer tips
              </div>
            </div>
          </div>
          <span className="strong" style={{ color: 'var(--blue-700)' }}>History →</span>
        </Link>
      </div>

      {/* SHIFT CHECKLIST */}
      <div className="card mt24">
        <h4>Saturday Delivery-Day Checklist</h4>
        <div className="stack tiny mt8" style={{ gap: '8px' }}>
          <label className="check">
            <input type="checkbox" defaultChecked /> Clean vehicle with cooler & insulated bags
          </label>
          <label className="check">
            <input type="checkbox" defaultChecked /> Smartphone charged with Google Maps active
          </label>
          <label className="check">
            <input type="checkbox" defaultChecked /> Verify BuckDuck bag count with merchant before signing
          </label>
          <label className="check">
            <input type="checkbox" defaultChecked /> Mandatory clear drop-off photo of sealed bags at doorstep
          </label>
        </div>
      </div>
    </div>
  );
}

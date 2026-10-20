'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, formatMoney, formatTime } from '../../lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user, token } = useAuth();

  const [windows, setWindows] = useState<any[]>([]);
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null);
  const [tipCents, setTipCents] = useState<number>(400); // $4 default tip
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address fields
  const [addressLine1, setAddressLine1] = useState('8401 Colesville Rd');
  const [addressLine2, setAddressLine2] = useState('Apt 4B');
  const [city, setCity] = useState('Silver Spring');
  const [state, setState] = useState('MD');
  const [zip, setZip] = useState('20910');
  const [phone, setPhone] = useState('(301) 555-0101');
  const [notes, setNotes] = useState('Please leave in apartment building lobby.');

  useEffect(() => {
    // Load delivery windows
    apiRequest('GET', '/api/windows').then((res) => {
      const openWins = (res.windows || []).filter((w: any) => w.open);
      setWindows(openWins);
      if (openWins.length > 0) {
        setSelectedWindowId(openWins[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      apiRequest('POST', '/api/checkout/quote', {
        items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        tip_cents: tipCents,
      })
        .then((q) => setQuote(q))
        .catch((err) => setError(err.message));
    }
  }, [cart, tipCents]);

  const handlePlaceOrder = async (method: string) => {
    if (!token) {
      alert('Please sign in or select a demo role in the bottom bar to complete checkout.');
      return;
    }
    if (!selectedWindowId) {
      setError('Please select a Saturday delivery window');
      return;
    }

    setPaying(true);
    setError(null);

    try {
      // 1. Create checkout intent
      const checkoutRes = await apiRequest(
        'POST',
        '/api/checkout',
        {
          items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
          window_id: selectedWindowId,
          tip_cents: tipCents,
          address: {
            line1: addressLine1,
            line2: addressLine2,
            city,
            state,
            zip,
          },
          phone,
          notes,
        },
        token,
      );

      // 2. Confirm payment
      const confirmRes = await apiRequest(
        'POST',
        `/api/checkout/${checkoutRes.checkout_id}/confirm`,
        { payment_method: method },
        token,
      );

      clearCart();
      const firstOrderId = confirmRes.orders?.[0]?.id || '';
      router.push(firstOrderId ? `/orders/${firstOrderId}` : '/account');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container section center">
        <h2>Your cart is empty</h2>
        <a href="/stores" className="btn btn-primary mt16">
          Browse stores
        </a>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="display">Saturday Checkout</h1>
      <p className="muted small mt0">
        Review your delivery details, select your preferred Saturday window, and complete payment.
      </p>

      {error && (
        <div className="alert err mt16 mb16" style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '12px', borderRadius: '8px' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid g3" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: '24px' }}>
          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="card">
            <h3>1. Delivery Address</h3>
            <div className="form-grid mt16">
              <label className="field span4">
                Street address
                <input
                  className="input"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
              </label>
              <label className="field span2">
                Apt, suite, unit
                <input
                  className="input"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </label>
              <label className="field span2">
                City
                <input
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </label>
              <label className="field span2">
                State
                <input
                  className="input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </label>
              <label className="field span2">
                ZIP code
                <input
                  className="input"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                />
              </label>
              <label className="field span3">
                Phone number (for driver SMS)
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label className="field span3">
                Drop-off notes
                <input
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gate code, porch, concierge..."
                />
              </label>
            </div>
          </div>

          {/* STEP 2: SATURDAY DELIVERY WINDOW */}
          <div className="card">
            <h3>2. Saturday Delivery Window</h3>
            <p className="tiny muted mt0">
              Orders close 24 hours prior to window start. Spots are locked upon payment.
            </p>

            <div className="stack mt16" style={{ gap: '10px' }}>
              {windows.map((w) => {
                const isSelected = selectedWindowId === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWindowId(w.id)}
                    className="window-opt card flat"
                    style={{
                      border: isSelected ? '2px solid var(--navy-900)' : '1px solid var(--line)',
                      background: isSelected ? 'var(--blue-50)' : '#fff',
                      cursor: 'pointer',
                      padding: '16px',
                    }}
                  >
                    <div className="row between">
                      <div>
                        <b>{w.date} · {w.label}</b>
                        <div className="tiny muted">
                          {formatTime(w.start_time)} to {formatTime(w.end_time)}
                        </div>
                      </div>
                      <span className="badge b-gold">{w.remaining} spots left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: DRIVER TIP */}
          <div className="card">
            <h3>3. Driver Tip</h3>
            <p className="tiny muted mt0">
              100% of tips are passed directly to your Saturday BuckDuck driver.
            </p>

            <div className="row wrap mt16" style={{ gap: '8px' }}>
              {[0, 200, 400, 600, 800].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipCents(amt)}
                  className={`chip ${tipCents === amt ? 'active' : ''}`}
                  style={{
                    background: tipCents === amt ? 'var(--navy-900)' : '#fff',
                    color: tipCents === amt ? '#fff' : 'inherit',
                  }}
                >
                  {amt === 0 ? 'No tip' : formatMoney(amt)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 4: PAYMENT SUMMARY & ACTION */}
        <div className="card" style={{ position: 'sticky', top: '90px' }}>
          <h3>Payment</h3>

          <div className="stack small mt16" style={{ gap: '10px' }}>
            <div className="row between">
              <span className="muted">Groceries Subtotal</span>
              <b>{formatMoney(quote?.subtotal_cents)}</b>
            </div>
            <div className="row between">
              <span className="muted">Delivery Fee</span>
              <span>{formatMoney(quote?.delivery_fee_cents)}</span>
            </div>
            <div className="row between">
              <span className="muted">Platform Service Fee</span>
              <span>{formatMoney(quote?.service_fee_cents)}</span>
            </div>
            <div className="row between">
              <span className="muted">Driver Tip</span>
              <span>{formatMoney(tipCents)}</span>
            </div>

            <div
              className="row between mt16 strong"
              style={{ fontSize: '20px', borderTop: '2px solid var(--line)', paddingTop: '12px' }}
            >
              <span>Total Pay</span>
              <span style={{ color: 'var(--navy-900)' }}>
                {formatMoney(quote?.total_cents || 0)}
              </span>
            </div>
          </div>

          {!user && (
            <div className="alert warn mt16 small" style={{ background: 'var(--blue-50)', padding: '10px', borderRadius: '8px', color: 'var(--blue-700)' }}>
              💡 Not signed in? Click <b>🛒 Shopper</b> in the bottom bar for 1-click test checkout!
            </div>
          )}

          <div className="stack mt24" style={{ gap: '10px' }}>
            <button
              type="button"
              disabled={paying}
              onClick={() => handlePlaceOrder('card')}
              className="btn btn-primary btn-block btn-lg"
            >
              {paying ? 'Processing payment...' : `Pay ${formatMoney(quote?.total_cents || 0)} with Card`}
            </button>

            <button
              type="button"
              disabled={paying}
              onClick={() => handlePlaceOrder('apple_pay')}
              className="btn btn-ghost btn-block"
              style={{ border: '1px solid #000', fontWeight: 700 }}
            >
               Apple Pay
            </button>

            <button
              type="button"
              disabled={paying}
              onClick={() => handlePlaceOrder('google_pay')}
              className="btn btn-ghost btn-block"
              style={{ border: '1px solid #CBD5E1', fontWeight: 700 }}
            >
              G Google Pay
            </button>
          </div>

          <div className="center tiny muted mt16">
            🔒 Test mode enabled · Instant mock card confirmation
          </div>
        </div>
      </div>
    </div>
  );
}

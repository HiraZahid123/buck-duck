'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { apiRequest, formatMoney } from '../../lib/api';

export default function CartPage() {
  const { cart, itemsByStore, setQty, cartSubtotal, clearCart } = useCart();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cart.length > 0) {
      setLoading(true);
      apiRequest('POST', '/api/checkout/quote', {
        items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
      })
        .then((q) => setQuote(q))
        .catch((err) => console.error('Quote error:', err))
        .finally(() => setLoading(false));
    } else {
      setQuote(null);
    }
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="container section center" style={{ padding: '80px 20px' }}>
        <div style={{ fontSize: '56px' }}>🛍️</div>
        <h2 className="display mt16">Your BuckDuck cart is empty</h2>
        <p className="muted small">
          Add specialty goods from your favorite African, Caribbean and local stores. Combine items from different stores into one delivery!
        </p>
        <a href="/stores" className="btn btn-primary btn-lg mt24">
          Start shopping local stores →
        </a>
      </div>
    );
  }

  const storeGroups = Object.values(itemsByStore);
  const minOrderMet = (quote?.subtotal_cents || cartSubtotal) >= 1500;

  return (
    <div className="container section">
      <div className="row between mb16">
        <div>
          <h1 className="display">Multi-Store Cart</h1>
          <p className="muted small mt0">
            Shopping across {storeGroups.length} local store{storeGroups.length === 1 ? '' : 's'} · Arriving this Saturday
          </p>
        </div>
        <button type="button" onClick={clearCart} className="btn btn-ghost btn-sm">
          Clear cart
        </button>
      </div>

      <div className="grid g3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'flex-start', gap: '24px' }}>
        {/* CART ITEMS BY STORE */}
        <div className="stack" style={{ gap: '24px' }}>
          {storeGroups.map((group) => {
            const storeSubtotal = group.items.reduce((sum, item) => sum + item.price_cents * item.qty, 0);
            const totalItems = group.items.reduce((sum, item) => sum + item.qty, 0);
            const estBags = Math.max(1, Math.ceil(totalItems / 10));

            return (
              <div key={group.store_id} className="card">
                <div className="card-h">
                  <div>
                    <h3 style={{ display: 'inline' }}>{group.store_name}</h3>
                    <div className="tiny muted mt4">
                      {totalItems} item{totalItems === 1 ? '' : 's'} · ~{estBags} BuckDuck bag{estBags > 1 ? 's' : ''} packed fresh
                    </div>
                  </div>
                  <span className="badge b-blue">$5.99 delivery fee</span>
                </div>

                <div className="stack" style={{ gap: '12px' }}>
                  {group.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="row between"
                      style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}
                    >
                      <div className="row" style={{ gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{item.emoji || '🛒'}</span>
                        <div>
                          <div className="strong" style={{ fontSize: '14px' }}>
                            {item.name}
                          </div>
                          <div className="tiny muted">
                            {formatMoney(item.price_cents)} {item.unit ? `· ${item.unit}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="row" style={{ gap: '12px' }}>
                        <div
                          className="stepper"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid var(--line-2)',
                            borderRadius: '999px',
                            padding: '2px 8px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(item, item.qty - 1)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, fontSize: '15px' }}
                          >
                            −
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(item, item.qty + 1)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, fontSize: '15px' }}
                          >
                            +
                          </button>
                        </div>

                        <span className="strong" style={{ minWidth: '60px', textAlign: 'right' }}>
                          {formatMoney(item.price_cents * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="row between mt16 small" style={{ color: 'var(--ink-2)' }}>
                  <span>Store subtotal:</span>
                  <b>{formatMoney(storeSubtotal)}</b>
                </div>
              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY */}
        <div className="card" style={{ position: 'sticky', top: '90px' }}>
          <h3 className="mb16">Order Summary</h3>

          <div className="stack small" style={{ gap: '10px' }}>
            <div className="row between">
              <span className="muted">Groceries Subtotal</span>
              <b>{formatMoney(quote?.subtotal_cents || cartSubtotal)}</b>
            </div>

            <div className="row between">
              <span className="muted">
                Delivery ({storeGroups.length} store{storeGroups.length > 1 ? 's' : ''} @ $5.99)
              </span>
              <span>{formatMoney(quote?.delivery_fee_cents || storeGroups.length * 599)}</span>
            </div>

            <div className="row between">
              <span className="muted">Platform Service Fee (5%, min $1.99)</span>
              <span>
                {formatMoney(
                  quote?.service_fee_cents || Math.max(199, Math.round(cartSubtotal * 0.05)),
                )}
              </span>
            </div>

            <div
              className="row between mt16 strong"
              style={{ fontSize: '18px', borderTop: '2px solid var(--line)', paddingTop: '12px' }}
            >
              <span>Estimated Total</span>
              <span style={{ color: 'var(--navy-900)' }}>
                {formatMoney(quote?.total_cents || cartSubtotal + storeGroups.length * 599 + Math.max(199, Math.round(cartSubtotal * 0.05)))}
              </span>
            </div>
          </div>

          {!minOrderMet && (
            <div className="alert warn mt16 small" style={{ background: 'var(--amber-bg)', padding: '10px', borderRadius: '8px', color: 'var(--amber)' }}>
              ⚠️ Minimum order is $15.00 before fees. Add ${((1500 - cartSubtotal) / 100).toFixed(2)} more.
            </div>
          )}

          <a
            href={minOrderMet ? '/checkout' : '#'}
            className={`btn btn-gold btn-lg btn-block mt24 ${!minOrderMet ? 'disabled' : ''}`}
            style={{ pointerEvents: minOrderMet ? 'auto' : 'none', opacity: minOrderMet ? 1 : 0.6 }}
          >
            Proceed to Saturday Checkout →
          </a>

          <div className="center tiny muted mt16">
            🔒 Bank-grade Stripe encryption · Cards, Apple Pay & Google Pay
          </div>
        </div>
      </div>
    </div>
  );
}

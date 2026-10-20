'use client';

import React from 'react';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../lib/api';

export function ProductCard({ product, store }: { product: any; store: any }) {
  const { cartQty, setQty } = useCart();
  const currentQty = cartQty(product.id);
  const isSoldOut = product.stock < 1;

  const fullProduct = {
    ...product,
    storeId: store.id,
    store_name: store.name,
    store_slug: store.slug,
  };

  return (
    <div className="product card flat">
      <div className="product-media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-emoji" style={{ fontSize: '48px', textAlign: 'center', padding: '16px 0' }}>
            {product.emoji || '🛒'}
          </div>
        )}
      </div>

      <div className="product-info mt8">
        <div className="row between">
          <span className="price strong" style={{ fontSize: '18px', color: 'var(--navy-900)' }}>
            {formatMoney(product.priceCents || product.price_cents)}
          </span>
          {product.unit && <span className="tiny muted">{product.unit}</span>}
        </div>

        <h4 className="mt8 mb0" style={{ fontSize: '15px', fontWeight: 600 }}>
          {product.name}
        </h4>
        <p className="tiny muted mt4" style={{ minHeight: '32px' }}>
          {product.description || `Fresh from ${store.name}`}
        </p>

        <div className="mt16">
          {isSoldOut ? (
            <button className="btn btn-ghost btn-sm btn-block" disabled>
              Sold out
            </button>
          ) : currentQty > 0 ? (
            <div className="stepper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--navy-900)', borderRadius: '999px', padding: '4px 8px' }}>
              <button
                type="button"
                onClick={() => setQty(fullProduct, currentQty - 1)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '4px 10px', fontSize: '16px' }}
                aria-label="Remove one"
              >
                −
              </button>
              <span style={{ fontWeight: 700 }}>{currentQty}</span>
              <button
                type="button"
                onClick={() => setQty(fullProduct, currentQty + 1)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '4px 10px', fontSize: '16px' }}
                aria-label="Add one"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-block"
              onClick={() => setQty(fullProduct, 1)}
            >
              + Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

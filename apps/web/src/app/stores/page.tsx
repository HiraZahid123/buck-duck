import React from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  let stores: any[] = [];
  let categories: string[] = [];

  try {
    const data = await apiRequest('GET', '/api/stores', {
      category: params.category,
      q: params.q,
    });
    stores = data.stores || [];
    categories = data.categories || [];
  } catch (err) {
    console.error('Failed to load stores:', err);
  }

  const storeColors: Record<string, string> = {
    'accra-market': '#B7791F',
    'island-spice-mart': '#D69E2E',
    'prime-cut-halal-meats': '#9B2C2C',
    'golden-crust-bakery': '#975A16',
    'lagos-pantry': '#C53030',
    'green-valley-produce': '#2F855A',
  };

  const storeEmojis: Record<string, string> = {
    'accra-market': '🌍',
    'island-spice-mart': '🍍',
    'prime-cut-halal-meats': '🥩',
    'golden-crust-bakery': '🥐',
    'lagos-pantry': '🌶️',
    'green-valley-produce': '🥬',
  };

  return (
    <div className="container section">
      <div className="row between mb16">
        <div>
          <h1 className="display">Local Grocery Stores</h1>
          <p className="muted small mt0">
            {stores.length} independent specialty grocers currently delivering in Silver Spring, MD.
          </p>
        </div>
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="row wrap mb16" style={{ gap: '8px' }}>
        <Link
          href="/stores"
          className={`chip ${!params.category ? 'active' : ''}`}
          style={{ background: !params.category ? 'var(--navy-900)' : '#fff', color: !params.category ? '#fff' : 'inherit' }}
        >
          All Stores
        </Link>
        {categories.map((cat) => {
          const isActive = params.category === cat;
          return (
            <Link
              key={cat}
              href={`/stores?category=${encodeURIComponent(cat)}`}
              className={`chip ${isActive ? 'active' : ''}`}
              style={{ background: isActive ? 'var(--navy-900)' : '#fff', color: isActive ? '#fff' : 'inherit' }}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* STORES GRID */}
      {stores.length === 0 ? (
        <div className="card center mt32" style={{ padding: '40px' }}>
          <div style={{ fontSize: '40px' }}>🏪</div>
          <h3>No stores found</h3>
          <p className="muted small">Try choosing another category or clearing your search filter.</p>
          <Link href="/stores" className="btn btn-primary btn-sm mt16">
            Reset filters
          </Link>
        </div>
      ) : (
        <div className="store-grid mt24">
          {stores.map((s) => {
            const coverColor = storeColors[s.slug] || s.color || '#B7791F';
            const emoji = storeEmojis[s.slug] || s.emoji || '🏪';

            return (
              <Link key={s.id} href={`/stores/${s.slug}`} className="store-card">
                <div className="cover" style={{ background: coverColor }}>
                  <div className="avatar">{emoji}</div>
                </div>
                <div className="body">
                  <h4 style={{ fontSize: '17px', margin: '0 0 4px' }}>{s.name}</h4>
                  <div className="tiny muted">{s.tagline || s.description?.slice(0, 60)}</div>
                  <div className="meta">
                    <span>★ {s.rating ? s.rating.toFixed(1) : '5.0'}</span> ·{' '}
                    <span>{s.category}</span> ·{' '}
                    <span>{s.product_count || 12} items</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

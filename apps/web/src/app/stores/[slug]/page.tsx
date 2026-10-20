import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { ProductCard } from '../../../components/ProductCard';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await apiRequest('GET', `/api/stores/${slug}`);
    const store = data.store;
    return {
      title: `${store.name} — Saturday Grocery Delivery | BuckDuck`,
      description: `${store.tagline || store.description} Order online for Saturday delivery in Silver Spring, MD.`,
      openGraph: {
        title: `${store.name} on BuckDuck`,
        description: store.description,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Store Not Found | BuckDuck',
    };
  }
}

export default async function StoreDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sParams = await searchParams;

  let storeData: any = null;
  try {
    storeData = await apiRequest('GET', `/api/stores/${slug}`);
  } catch {
    notFound();
  }

  const { store, products } = storeData;
  const activeCategory = sParams.category || 'All';

  // Distinct categories inside this store
  const categories = ['All', ...Array.from(new Set(products.map((p: any) => p.category))) as string[]];

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter((p: any) => p.category === activeCategory);

  // JSON-LD structured schema for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    name: store.name,
    description: store.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.address || '',
      addressLocality: store.city || 'Silver Spring',
      addressRegion: store.state || 'MD',
      postalCode: store.zip || '20910',
      addressCountry: 'US',
    },
    telephone: store.phone,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: store.rating || 4.9,
      reviewCount: 48,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* STORE HERO BANNER */}
      <section className="store-header" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', padding: '36px 0' }}>
        <div className="container">
          <div className="row between wrap">
            <div className="row" style={{ gap: '20px' }}>
              <div
                className="store-avatar"
                style={{
                  fontSize: '48px',
                  background: `${store.color || '#1E3A8A'}15`,
                  width: '90px',
                  height: '90px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${store.color || '#1E3A8A'}`,
                }}
              >
                {store.emoji || '🏪'}
              </div>

              <div>
                <div className="row" style={{ gap: '10px' }}>
                  <h1 className="display mb0" style={{ fontSize: '32px' }}>
                    {store.name}
                  </h1>
                  <span className="badge b-gold">★ {store.rating?.toFixed(1)}</span>
                </div>
                <div className="tiny muted mt4">
                  {store.category} · {store.address}, {store.city}, {store.state} {store.zip}
                </div>
                <p className="small muted mt8" style={{ maxWidth: '650px' }}>
                  {store.description || store.tagline}
                </p>
              </div>
            </div>

            <div className="card flat" style={{ background: 'var(--surface-2)', minWidth: '220px' }}>
              <div className="tiny muted">Delivery Window</div>
              <div className="strong mt4">Every Saturday</div>
              <div className="tiny muted mt4">Packed fresh in BuckDuck bags</div>
              <div className="badge b-blue mt8">Delivery: $5.99</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <section className="container section">
        <div className="row between mb16">
          <div className="row wrap" style={{ gap: '8px' }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Link
                  key={cat}
                  href={`/stores/${store.slug}${cat === 'All' ? '' : `?category=${encodeURIComponent(cat)}`}`}
                  className={`chip ${isActive ? 'active' : ''}`}
                  style={{
                    background: isActive ? 'var(--navy-900)' : '#fff',
                    color: isActive ? '#fff' : 'inherit',
                  }}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          <div className="muted small">
            Showing {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="card center mt32" style={{ padding: '40px' }}>
            <p className="muted">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid g4 mt24">
            {filteredProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} store={store} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

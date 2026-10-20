import React from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { ProductCard } from '../../components/ProductCard';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  let products: any[] = [];

  if (q?.trim()) {
    try {
      const data = await apiRequest('GET', '/api/search', { q: q.trim() });
      products = data.products || [];
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  return (
    <div className="container section">
      <div className="row between mb16">
        <div>
          <h1 className="display">Search Results</h1>
          <p className="muted small mt0">
            {q ? (
              <>
                Found {products.length} product{products.length === 1 ? '' : 's'} matching &ldquo;<b>{q}</b>&rdquo;
              </>
            ) : (
              'Enter a keyword to search specialty products across all stores.'
            )}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card center mt32" style={{ padding: '40px' }}>
          <div style={{ fontSize: '40px' }}>🔍</div>
          <h3>No matching items found</h3>
          <p className="muted small">Try searching for staples like &ldquo;plantains&rdquo;, &ldquo;egusi&rdquo;, &ldquo;goat meat&rdquo;, or &ldquo;bread&rdquo;.</p>
          <Link href="/stores" className="btn btn-primary btn-sm mt16">
            Browse all stores
          </Link>
        </div>
      ) : (
        <div className="grid g4 mt24">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              store={{
                id: p.store_id,
                name: p.store_name,
                slug: p.store_slug,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

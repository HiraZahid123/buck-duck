import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="card center" style={{ maxWidth: '480px', width: '100%', padding: '48px 24px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🦆</div>
        <h1 className="display" style={{ fontSize: '32px', margin: '0 0 12px' }}>Page Not Found</h1>
        <p className="muted" style={{ marginBottom: '24px' }}>
          We couldn&apos;t find the grocery page or store you were looking for. It may have moved or been updated.
        </p>
        <div className="row center" style={{ gap: '12px', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-gold">
            Return Home
          </Link>
          <Link href="/stores" className="btn btn-ghost">
            Browse Stores
          </Link>
        </div>
      </div>
    </div>
  );
}

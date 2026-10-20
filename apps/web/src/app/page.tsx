import React from 'react';
import Link from 'next/link';
import { apiRequest } from '../lib/api';

async function getData() {
  try {
    const [storesData, configData] = await Promise.all([
      apiRequest('GET', '/api/stores'),
      apiRequest('GET', '/api/config'),
    ]);
    return {
      stores: storesData.stores || [],
      categories: storesData.categories || [],
      config: configData,
    };
  } catch {
    return { stores: [], categories: [], config: null };
  }
}

export default async function HomePage() {
  const { stores, categories, config } = await getData();

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
    <div>
      {/* 1. HERO SECTION (Dark Navy with Radial Gradients) */}
      <section className="hero">
        <div className="container">
          <div>
            <div className="eyebrow">
              ★ SATURDAY GROCERY DELIVERY
            </div>
            <h1>
              Your neighborhood grocers.{' '}
              <em>Delivered every Saturday.</em>
            </h1>
            <p className="lead">
              Shop African, Caribbean and local markets in one cart. Each store packs your order in sealed BuckDuck bags, and our drivers bring it all to your door in the window you choose.
            </p>

            <div className="row mt24">
              <Link href="/stores" className="btn btn-gold btn-lg">
                Start shopping
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-ghost btn-lg"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                How it works
              </a>
            </div>

            <div
              className="row wrap mt24 tiny"
              style={{ color: 'rgba(255,255,255,0.7)', gap: '18px' }}
            >
              <span>✓ 6 local stores</span>
              <span>✓ One delivery fee per store</span>
              <span>✓ Apple Pay & Google Pay</span>
            </div>
          </div>

          {/* RIGHT FLOATING HERO CARD: NEXT DELIVERY DAY */}
          <div className="hero-card">
            <div className="row between">
              <div
                className="tiny strong"
                style={{ color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '.08em' }}
              >
                NEXT DELIVERY DAY
              </div>
              <span style={{ fontSize: '26px' }}>🚚</span>
            </div>

            <h2 style={{ color: '#fff', margin: '6px 0 16px', fontSize: '26px' }} className="display">
              Saturday, October 24
            </h2>

            {/* Window 1: Morning */}
            <div className="slot">
              <div>
                <div className="t" style={{ color: '#fff', fontSize: '14px' }}>
                  Morning · 6 AM – 12 PM
                </div>
                <div className="tiny" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  107 spots left · order by Oct 23, 6:00 AM
                </div>
              </div>
              <div className="bar">
                <i style={{ width: '85%' }}></i>
              </div>
            </div>

            {/* Window 2: Afternoon */}
            <div className="slot">
              <div>
                <div className="t" style={{ color: '#fff', fontSize: '14px' }}>
                  Afternoon · 12 PM – 4 PM
                </div>
                <div className="tiny" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  103 spots left · order by Oct 23, 12:00 PM
                </div>
              </div>
              <div className="bar">
                <i style={{ width: '78%' }}></i>
              </div>
            </div>

            <Link href="/stores" className="btn btn-gold btn-block btn-lg mt16">
              Reserve my window
            </Link>
          </div>
        </div>
      </section>

      {/* 2. HOW BUCKDUCK WORKS */}
      <section id="how-it-works" className="section container">
        <h2 style={{ fontFamily: 'var(--display)', fontSize: '30px' }}>How BuckDuck works</h2>
        <p className="muted small mt0">Built around one predictable weekly delivery day.</p>

        <div className="steps mt32">
          <div className="step">
            <div className="n">1</div>
            <h4 style={{ fontSize: '16px' }}>Shop many stores</h4>
            <p className="small muted">
              Fill one cart from any of our partner grocers — produce, meats, pantry staples and bakery.
            </p>
          </div>

          <div className="step">
            <div className="n">2</div>
            <h4 style={{ fontSize: '16px' }}>Pick your Saturday window</h4>
            <p className="small muted">
              Choose Morning (6 AM – 12 PM) or Afternoon (12 PM – 4 PM). Pay securely with card, Apple Pay or Google Pay.
            </p>
          </div>

          <div className="step">
            <div className="n">3</div>
            <h4 style={{ fontSize: '16px' }}>Stores pack in BuckDuck bags</h4>
            <p className="small muted">
              Each store prepares your items in sealed, labeled BuckDuck packaging ready for pickup.
            </p>
          </div>

          <div className="step">
            <div className="n">4</div>
            <h4 style={{ fontSize: '16px' }}>Delivered to your door</h4>
            <p className="small muted">
              A vetted BuckDuck driver collects and delivers within your window, with live status updates.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SHOP LOCAL STORES */}
      <section className="section container">
        <div className="row between mb16">
          <h2 style={{ fontFamily: 'var(--display)', fontSize: '30px' }}>Shop local stores</h2>
          <Link href="/stores" className="small strong" style={{ color: 'var(--blue-700)' }}>
            View all →
          </Link>
        </div>

        {/* CATEGORY CHIPS */}
        <div className="chips mb24">
          <Link href="/stores" className="chip active">
            All Stores
          </Link>
          {categories.map((cat: string) => (
            <Link key={cat} href={`/stores?category=${encodeURIComponent(cat)}`} className="chip">
              {cat}
            </Link>
          ))}
        </div>

        {/* STORE CARDS GRID WITH COVER BANNER & FLOATING AVATAR */}
        <div className="store-grid">
          {stores.map((s: any) => {
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
      </section>

      {/* 4. DUAL CTA CARDS */}
      <section className="container" style={{ paddingBottom: '64px' }}>
        <div className="cta-band">
          {/* MERCHANT CTA (Royal Blue Gradient) */}
          <div className="cta merchant">
            <h3>Own a grocery store?</h3>
            <p className="small mt8" style={{ opacity: 0.9, maxWidth: '440px' }}>
              Open your StoreFront in minutes. We handle payments, packaging, drivers and delivery — you focus on great products.
            </p>
            <Link href="/register?role=merchant" className="btn btn-gold mt24">
              Open your storefront
            </Link>
          </div>

          {/* DRIVER CTA (Deep Olive/Brown Gradient) */}
          <div className="cta driver">
            <h3>Drive Saturdays. Earn more.</h3>
            <p className="small mt8" style={{ opacity: 0.9, maxWidth: '440px' }}>
              One concentrated day of batched routes, base pay per stop, and you keep 100% of tips.
            </p>
            <Link href="/register?role=driver" className="btn btn-gold mt24">
              Apply to drive
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

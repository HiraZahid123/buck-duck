'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo, Icon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getDashboardLink = () => {
    if (!user) return { href: '/login', label: 'Sign in' };
    if (user.role === 'merchant') return { href: '/merchant', label: 'Merchant' };
    if (user.role === 'driver') return { href: '/driver', label: 'Driver' };
    if (user.role === 'admin') return { href: '/admin', label: 'Admin' };
    return { href: '/account', label: user.name.split(' ')[0] };
  };

  const dash = getDashboardLink();

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>
            🦆 <span className="gold">One delivery day. Every week.</span>{' '}
            <span className="hide-sm">Order from multiple local stores — it all arrives Saturday.</span>
          </span>
          <span className="hide-sm">
            Next delivery: <b>Saturday, Oct 24</b> · Order by Oct 23, 6:00 AM
          </span>
        </div>
      </div>

      <header className="nav">
        <div className="container">
          <Logo />

          <form className="search" onSubmit={handleSearch} role="search">
            <Icon name="search" size={16} />
            <input
              name="q"
              placeholder="Search plantains, palm oil, goat meat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>

          <nav className="nav-links">
            <a className="nav-link" href="/stores">
              <Icon name="store" size={16} />
              <span className="lbl">Stores</span>
            </a>

            <a className="nav-link" href={dash.href}>
              <Icon name="user" size={16} />
              <span className="lbl">{dash.label}</span>
            </a>

            <a className="nav-link cart-btn" href="/cart" aria-label="Cart">
              <Icon name="cart" size={18} />
              <span className="lbl">Cart</span>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

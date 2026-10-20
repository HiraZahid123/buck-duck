'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, demoAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      const destinations: Record<string, string> = {
        customer: '/account',
        merchant: '/merchant',
        driver: '/driver',
        admin: '/admin',
      };
      router.push(destinations[res.user.role] || '/account');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section center" style={{ maxWidth: '440px' }}>
      <div className="card" style={{ textAlign: 'left', padding: '32px' }}>
        <h2 className="display center">Sign in to BuckDuck</h2>
        <p className="muted small center mt4 mb24">
          Access your shopper cart, merchant portal, driver app, or admin console.
        </p>

        {error && (
          <div className="alert err mb16" style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px', borderRadius: '8px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack" style={{ gap: '14px' }}>
          <label className="field">
            Email address
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt12">
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        <div className="center mt24 small">
          <span className="muted">Don&apos;t have an account?</span>{' '}
          <Link href="/register" className="strong">
            Create account
          </Link>
        </div>

        {/* DEMO ACCOUNTS QUICK TEST */}
        <div style={{ borderTop: '1px solid var(--line)', marginTop: '24px', paddingTop: '16px' }}>
          <div className="tiny muted center mb8">Demo 1-Click Login (Silver Spring Launch):</div>
          <div className="row wrap" style={{ gap: '6px', justifyContent: 'center' }}>
            <button type="button" onClick={() => demoAs('customer')} className="chip" style={{ fontSize: '12px' }}>
              🛒 Shopper
            </button>
            <button type="button" onClick={() => demoAs('merchant')} className="chip" style={{ fontSize: '12px' }}>
              🏪 Accra Market
            </button>
            <button type="button" onClick={() => demoAs('driver')} className="chip" style={{ fontSize: '12px' }}>
              🚚 Driver Kwame
            </button>
            <button type="button" onClick={() => demoAs('admin')} className="chip" style={{ fontSize: '12px' }}>
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

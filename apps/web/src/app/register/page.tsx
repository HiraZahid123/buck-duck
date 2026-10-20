'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'customer';

  const { register } = useAuth();
  const [role, setRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('African Groceries');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await register({
        name,
        email,
        password,
        role,
        phone,
        vehicle: role === 'driver' ? vehicle : undefined,
        store_name: role === 'merchant' ? storeName : undefined,
        category: role === 'merchant' ? category : undefined,
      });

      const destinations: Record<string, string> = {
        customer: '/account',
        merchant: '/merchant',
        driver: '/driver',
        admin: '/admin',
      };
      router.push(destinations[res.user.role] || '/account');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ textAlign: 'left', padding: '32px' }}>
      <h2 className="display center">Create Account</h2>
      <p className="muted small center mt4 mb24">
        Join the BuckDuck Saturday delivery marketplace.
      </p>

      {error && (
        <div className="alert err mb16" style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px', borderRadius: '8px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ROLE SELECTOR CHIPS */}
      <div className="row wrap mb24" style={{ gap: '8px', justifyContent: 'center' }}>
        {[
          { id: 'customer', label: '🛒 Customer' },
          { id: 'merchant', label: '🏪 Sell Groceries' },
          { id: 'driver', label: '🚚 Deliver' },
        ].map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={`chip ${role === r.id ? 'active' : ''}`}
            style={{
              background: role === r.id ? 'var(--navy-900)' : '#fff',
              color: role === r.id ? '#fff' : 'inherit',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="stack" style={{ gap: '14px' }}>
        <label className="field">
          Full name
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Efua Boateng"
            required
          />
        </label>

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
          Password (min 8 characters)
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
        </label>

        <label className="field">
          Phone number
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(301) 555-0199"
          />
        </label>

        {role === 'merchant' && (
          <>
            <label className="field">
              Storefront Name
              <input
                type="text"
                className="input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Accra Market Silver Spring"
                required
              />
            </label>

            <label className="field">
              Store Category
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>African Groceries</option>
                <option>Caribbean</option>
                <option>Meat & Seafood</option>
                <option>Bakery</option>
                <option>Fresh Produce</option>
              </select>
            </label>
          </>
        )}

        {role === 'driver' && (
          <label className="field">
            Vehicle Make & Model
            <input
              type="text"
              className="input"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. Toyota Sienna · Silver"
              required
            />
          </label>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt12">
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>
      </form>

      <div className="center mt24 small">
        <span className="muted">Already registered?</span>{' '}
        <Link href="/login" className="strong">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="container section center" style={{ maxWidth: '500px' }}>
      <Suspense fallback={<div className="card p24">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

import React from 'react';
import { Logo } from './Icons';

export function Footer() {
  return (
    <footer className="footer no-print">
      <div className="container">
        <div className="grid g4">
          <div>
            <Logo />
            <p className="mt16 small">
              BuckDuck connects neighborhood grocers with families through one dependable weekly Saturday delivery day.
            </p>
            <div className="small muted mt8">Silver Spring & Montgomery County, MD Pilot Zone</div>
          </div>

          <div>
            <h4>Shop</h4>
            <div className="stack small" style={{ gap: '6px' }}>
              <a href="/stores">All local stores</a>
              <a href="/cart">Multi-store cart</a>
              <a href="/account">My order tracking</a>
            </div>
          </div>

          <div>
            <h4>Partner with us</h4>
            <div className="stack small" style={{ gap: '6px' }}>
              <a href="/register?role=merchant">Sell on StoreFront USA</a>
              <a href="/register?role=driver">Drive with BuckDuck</a>
              <a href="/login">Partner portal sign in</a>
            </div>
          </div>

          <div>
            <h4>Secure payments</h4>
            <p className="small">
              Payments processed securely by Stripe. Card, Apple Pay, and Google Pay supported.
            </p>
            <div className="badge b-gold mt8">Stripe Connect Automated Payouts</div>
          </div>
        </div>

        <div className="mt32 tiny" style={{ borderTop: '1px solid var(--line-2)', paddingTop: '16px' }}>
          © {new Date().getFullYear()} BuckDuck Inc. · StoreFront USA marketplace · All rights reserved.
        </div>
      </div>
    </footer>
  );
}

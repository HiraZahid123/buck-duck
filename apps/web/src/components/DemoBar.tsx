'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';

export function DemoBar() {
  const { user, demoAs } = useAuth();
  const currentRole = user?.role;

  return (
    <div className="demo-bar no-print">
      <b>DEMO · View as</b>
      <button
        type="button"
        onClick={() => demoAs('customer')}
        className={currentRole === 'customer' ? 'on' : ''}
      >
        🛒 Shopper
      </button>
      <button
        type="button"
        onClick={() => demoAs('merchant')}
        className={currentRole === 'merchant' ? 'on' : ''}
      >
        🏪 Merchant
      </button>
      <button
        type="button"
        onClick={() => demoAs('driver')}
        className={currentRole === 'driver' ? 'on' : ''}
      >
        🚚 Driver
      </button>
      <button
        type="button"
        onClick={() => demoAs('admin')}
        className={currentRole === 'admin' ? 'on' : ''}
      >
        🛡️ Admin
      </button>
    </div>
  );
}

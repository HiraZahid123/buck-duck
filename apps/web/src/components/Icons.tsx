import React from 'react';

export function Icon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  const icons: Record<string, string> = {
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35',
    cart: 'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-12.8-15h16.2l-1.5 7.5h-13.1l-1.6-7.5zm0 0L5 2H2',
    user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
    bag: 'M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm11 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    chart: 'M18 20V10M12 20V4M6 20v-6',
    nav: 'M3 11l19-9-9 19-2-8-8-2z',
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    check: 'M20 6L9 17l-5-5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    x: 'M18 6L6 18M6 6l12 12',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  };

  const path = icons[name] || icons.search;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="/" className={`logo ${className}`}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #F7E08B 0%, #D4A017 50%, #9E7410 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: '0 2px 8px rgba(212,160,23,0.3)',
          flexShrink: 0,
        }}
      >
        🦆
      </div>
      <div className="wm" style={{ color: '#fff' }}>
        Buck<b style={{ color: '#E8BC3A' }}>Duck</b>
        <span className="sub" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', letterSpacing: '.16em' }}>
          STOREFRONT USA
        </span>
      </div>
    </a>
  );
}

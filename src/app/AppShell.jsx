import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── SVG Icons — Polar Theme ─────────────────────────────
const IconHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const IconHistory = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="8"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'} strokeWidth="1.7" />
    <path d="M11 7v4.5l3 2"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCoach = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M4 4h14a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    />
    <path d="M8 9h6M8 12h4"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'}
      strokeWidth="1.7" strokeLinecap="round"
    />
  </svg>
);

const IconProfile = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="8" r="3.5"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'} strokeWidth="1.7" />
    <path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7"
      stroke={active ? 'var(--ns-accent)' : 'var(--ns-text-disabled)'}
      strokeWidth="1.7" strokeLinecap="round"
    />
  </svg>
);

const IconScan = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="5" width="18" height="13" rx="2.5"
      stroke="var(--ns-bg-primary)" strokeWidth="1.7" />
    <circle cx="11" cy="11.5" r="3.5"
      stroke="var(--ns-bg-primary)" strokeWidth="1.7" />
    <path d="M15 5l1.5-2.5h-3L15 5z"
      stroke="var(--ns-bg-primary)" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// ── Status Bar ─────────────────────────────────────────────
export function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 24px 0',
    }}>
      <span style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--ns-text-primary)',
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {time}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
          <rect x="0"    y="3" width="3" height="9" rx="1" fill="currentColor" opacity=".25" />
          <rect x="4.5"  y="2" width="3" height="10" rx="1" fill="currentColor" opacity=".45" />
          <rect x="9"    y="0" width="3" height="12" rx="1" fill="currentColor" opacity=".65" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="currentColor" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <path d="M8 2C5 2 2.5 3.5 1 5.5L3 7.5C4 6 5.9 5 8 5s4 1 5 2.5l2-2C13.5 3.5 11 2 8 2z" fill="currentColor" opacity=".45" />
          <path d="M8 6c-1.5 0-2.8.6-3.7 1.5l2 2c.4-.4 1-.7 1.7-.7s1.3.3 1.7.7l2-2C10.8 6.6 9.5 6 8 6z" fill="currentColor" opacity=".65" />
          <circle cx="8" cy="11" r="1.5" fill="currentColor" />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
          <rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity=".35" />
          <rect x="22" y="4" width="3" height="4" rx="1" fill="currentColor" opacity=".4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Início',    Icon: IconHome },
  { path: '/history',   label: 'Histórico', Icon: IconHistory },
  { path: null,         label: 'Scan',      Icon: null, isFab: true },
  { path: '/coach',     label: 'Coach',     Icon: IconCoach },
  { path: '/profile',   label: 'Perfil',    Icon: IconProfile },
];

export function BottomNav({ onScanPress }) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="ns-bottom-nav">
      {NAV_ITEMS.map((item) => {
        if (item.isFab) {
          return (
            <button
              key="fab"
              className="ns-nav-item"
              onClick={onScanPress}
              aria-label="Escanear refeição"
              style={{ WebkitTapHighlightColor: 'transparent', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div className="ns-fab">
                <IconScan />
              </div>
            </button>
          );
        }

        const isActive = pathname === item.path ||
          (item.path !== '/dashboard' && pathname.startsWith(item.path));

        return (
          <div
            key={item.path}
            className={`ns-nav-item${isActive ? ' ns-nav-item--active' : ''}`}
            onClick={() => navigate(item.path)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Indicador de linha no topo */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 2,
                borderRadius: '0 0 3px 3px',
                background: 'var(--ns-accent)',
              }} />
            )}
            <div className="ns-nav-icon">
              <item.Icon active={isActive} />
            </div>
            <span
              className="ns-nav-label"
              style={{ color: isActive ? 'var(--ns-accent)' : 'var(--ns-text-disabled)' }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

// ── AppShell ───────────────────────────────────────────────
export default function AppShell({ children, onScanPress }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ns-bg-primary)' }}>
      {children}
      <BottomNav onScanPress={onScanPress} />
    </div>
  );
}

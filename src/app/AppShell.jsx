import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── SVG Icons ──────────────────────────────────────────────
const IconHome = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12L12 3l9 9V21h-5v-6H8v6H3V12z"
      stroke={active ? '#30D158' : '#636366'}
      strokeWidth="1.6"
      fill={active ? 'rgba(48,209,88,0.12)' : 'none'}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const IconHistory = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M4 12h12M4 18h14" stroke={active ? '#30D158' : '#636366'} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconProgress = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 18L8 11l4.5 3.5L18 6l3 3"
      stroke={active ? '#30D158' : '#636366'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCoach = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke={active ? '#30D158' : '#636366'} strokeWidth="1.6" />
    <path
      d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"
      stroke={active ? '#30D158' : '#636366'}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconProfile = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7.5" r="4" stroke={active ? '#30D158' : '#636366'} strokeWidth="1.6" />
    <path
      d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
      stroke={active ? '#30D158' : '#636366'}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconScan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 9V5h4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 9V5h-4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v4h4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 15v4h-4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="#000" strokeWidth="2" />
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
        color: '#fff',
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {time}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0"    y="3" width="3" height="9" rx="1" fill="#fff" opacity=".4" />
          <rect x="4.5"  y="2" width="3" height="10" rx="1" fill="#fff" opacity=".6" />
          <rect x="9"    y="0" width="3" height="12" rx="1" fill="#fff" opacity=".8" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#fff" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 2C5 2 2.5 3.5 1 5.5L3 7.5C4 6 5.9 5 8 5s4 1 5 2.5l2-2C13.5 3.5 11 2 8 2z" fill="#fff" opacity=".6" />
          <path d="M8 6c-1.5 0-2.8.6-3.7 1.5l2 2c.4-.4 1-.7 1.7-.7s1.3.3 1.7.7l2-2C10.8 6.6 9.5 6 8 6z" fill="#fff" opacity=".8" />
          <circle cx="8" cy="11" r="1.5" fill="#fff" />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="#fff" strokeOpacity=".35" />
          <rect x="22" y="4" width="3" height="4" rx="1" fill="#fff" opacity=".4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="#fff" />
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
    <nav
      className="ns-bottom-nav"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        borderTop: '0.5px solid rgba(255,255,255,0.10)',
      }}
    >
      {NAV_ITEMS.map((item, i) => {
        if (item.isFab) {
          return (
            <div
              key="fab"
              className="ns-nav-item"
              onClick={onScanPress}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className="ns-fab"
                style={{
                  background: '#30D158',
                  boxShadow: '0 0 0 4px #000, 0 4px 20px rgba(48,209,88,0.35)',
                  transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <IconScan />
              </div>
            </div>
          );
        }

        const isActive = pathname === item.path ||
          (item.path !== '/dashboard' && pathname.startsWith(item.path));

        return (
          <div
            key={item.path}
            className={`ns-nav-item${isActive ? ' ns-nav-item--active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Indicador de linha no topo — estilo iOS */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 2.5,
                borderRadius: '0 0 3px 3px',
                background: '#30D158',
                boxShadow: '0 0 8px rgba(48,209,88,0.6)',
              }} />
            )}
            <div className="ns-nav-icon">
              <item.Icon active={isActive} />
              {item.path === '/coach' && !isActive && (
                <div style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#30D158',
                  border: '1.5px solid #000',
                  animation: 'ns-pulse 2s ease infinite',
                }} />
              )}
            </div>
            <span
              className="ns-nav-label"
              style={{ color: isActive ? '#30D158' : '#636366' }}
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
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {children}
      <BottomNav onScanPress={onScanPress} />
    </div>
  );
}
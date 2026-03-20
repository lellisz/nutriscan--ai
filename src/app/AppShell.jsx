import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── SVG Icons ──────────────────────────────────────────────
const IconHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M3 11L11 3l8 8V19H14v-5H8v5H3V11z"
      stroke={active ? '#ebebf0' : '#ebebf0'}
      strokeWidth="1.8"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

const IconHistory = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="5" width="16" height="2" rx="1" fill="#ebebf0" />
    <rect x="3" y="10" width="12" height="2" rx="1" fill="#ebebf0" />
    <rect x="3" y="15" width="14" height="2" rx="1" fill="#ebebf0" />
  </svg>
);

const IconProgress = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <polyline
      points="3,16 7,10 11,13 19,4"
      stroke="#ebebf0"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCoach = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="8" r="3" stroke="#ebebf0" strokeWidth="1.8" />
    <path
      d="M7 14c0-2.2 1.8-4 4-4s4 1.8 4 4"
      stroke="#ebebf0"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M4 17h14M6 19.5h10"
      stroke="#ebebf0"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconProfile = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="4" stroke="#ebebf0" strokeWidth="1.8" />
    <path
      d="M3 19c0-4.4 3.6-8 8-8s8 3.6 8 8"
      stroke="#ebebf0"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const IconScan = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1" y="1" width="8" height="8" rx="2" stroke="#000" strokeWidth="2" />
    <rect x="13" y="1" width="8" height="8" rx="2" stroke="#000" strokeWidth="2" />
    <rect x="1" y="13" width="8" height="8" rx="2" stroke="#000" strokeWidth="2" />
    <rect x="13" y="13" width="3.5" height="3.5" rx=".6" fill="#000" />
    <rect x="17.5" y="13" width="3.5" height="3.5" rx=".6" fill="#000" />
    <rect x="13" y="17.5" width="3.5" height="3.5" rx=".6" fill="#000" />
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
    <nav className="ns-bottom-nav">
      {NAV_ITEMS.map((item, i) => {
        if (item.isFab) {
          return (
            <div key="fab" className="ns-nav-item" onClick={onScanPress}>
              <div className="ns-fab">
                <div className="ns-fab-ring-1" />
                <div className="ns-fab-ring-2" />
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
            style={{ position: 'relative' }}
          >
            <div className="ns-nav-icon">
              <item.Icon active={isActive} />
              {item.path === '/coach' && !isActive && (
                <div style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ebebf0',
                  border: '1.5px solid #000',
                  animation: 'ns-pulse 2s ease infinite',
                }} />
              )}
            </div>
            <span className="ns-nav-label">{item.label}</span>
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
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';

const GOALS = [
  { key: 'Calorias',    color: 'var(--ns-macro-prot)',  pct: 100, value: '2.732 kcal' },
  { key: 'Proteína',    color: 'var(--ns-macro-prot)',  pct: 38,  value: '150g/dia'   },
  { key: 'Carboidrato', color: 'var(--ns-macro-carb)',  pct: 65,  value: '260g/dia'   },
  { key: 'Gordura',     color: 'var(--ns-macro-fat)',   pct: 21,  value: '82g/dia'    },
  { key: 'Hidratação',  color: 'var(--ns-macro-water)', pct: 55,  value: '2.625ml'    },
];

const ACHIEVEMENTS = [
  { emoji: '🔥', label: '5 dias'     },
  { emoji: '📸', label: '10 scans'   },
  { emoji: '💧', label: 'Hidratação' },
  { emoji: '🎯', label: 'Meta'       },
];

const MENU = [
  { emoji: '👤', label: 'Dados pessoais',    right: true },
  { emoji: '🎯', label: 'Metas e objetivos', right: true },
  { emoji: '🤖', label: 'Modelo de IA',      badge: 'Groq' },
  { emoji: '🔔', label: 'Notificações',      badge: '2 novas' },
  { emoji: '🔒', label: 'Privacidade',       right: true },
  { emoji: '⚙️', label: 'Preferências',      right: true },
];

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const name    = profile?.name    ?? 'Felipe';
  const email   = user?.email      ?? 'felipe@email.com';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="ns-page">
      <StatusBar />

      {/* ── Avatar & Info ── */}
      <div style={{ padding: '16px var(--ns-page-px) 14px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--ns-bg-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: 'var(--ns-t-primary)', flexShrink: 0,
          border: '1.5px solid var(--ns-bg-3)',
          position: 'relative',
        }}>
          {initial}
          <div style={{
            position: 'absolute', inset: -5, borderRadius: '50%',
            border: '0.5px solid var(--ns-sep)',
          }} />
        </div>
        <div>
          <div style={{
            fontSize: 24, fontWeight: 700, color: 'var(--ns-t-primary)',
            letterSpacing: '-0.04em', lineHeight: 1.1,
          }}>{name}</div>
          <div style={{
            fontSize: 13, color: 'var(--ns-t-5)',
            marginTop: 3, letterSpacing: '-0.01em',
          }}>{email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--ns-t-3)',
              animation: 'ns-pulse 2s ease infinite',
            }} />
            <div style={{ fontSize: 11, color: 'var(--ns-t-4)', letterSpacing: '-0.01em' }}>
              Manutenção · 12 scans · 5d streak
            </div>
          </div>
        </div>
      </div>

      {/* ── Biometrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, margin: '0 var(--ns-page-px) 10px' }}>
        {[
          ['Idade', '30', 'anos'],
          ['Altura', '175', 'cm'],
          ['Peso', '75', 'kg'],
          ['IMC', '24.5', 'Normal'],
        ].map(([l, v, u], i) => (
          <div key={l} className="ns-bio-cell">
            <div className="ns-bio-label">{l}</div>
            <div className="ns-bio-value" style={i === 3 ? { color: 'var(--ns-t-1)' } : {}}>{v}</div>
            <div className="ns-bio-unit" style={i === 3 ? { color: 'var(--ns-t-2)' } : {}}>{u}</div>
          </div>
        ))}
      </div>

      {/* ── Goals ── */}
      <div className="ns-card-sm" style={{ margin: '0 var(--ns-page-px) 10px', overflow: 'hidden' }}>
        <div className="ns-label" style={{ padding: '14px 15px 10px' }}>
          Metas diárias · TDEE
        </div>
        {GOALS.map(g => (
          <div key={g.key} className="ns-goal-row">
            <span className="ns-goal-key">{g.key}</span>
            <div className="ns-bar-track" style={{ flex: 1 }}>
              <div className="ns-bar-fill" style={{ width: `${g.pct}%`, background: g.color }} />
            </div>
            <span className="ns-goal-value">{g.value}</span>
          </div>
        ))}
      </div>

      {/* ── Achievements ── */}
      <div className="ns-card-sm" style={{ margin: '0 var(--ns-page-px) 10px', padding: '14px 15px' }}>
        <div className="ns-label" style={{ marginBottom: 12 }}>
          Conquistas
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ACHIEVEMENTS.map(a => (
            <div key={a.label} className="ns-achievement">
              <div className="ns-achievement-icon">{a.emoji}</div>
              <div className="ns-achievement-label">{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="ns-card-sm" style={{ margin: '0 var(--ns-page-px) 8px', overflow: 'hidden' }}>
        <div className="ns-label" style={{ padding: '14px 15px 10px' }}>
          Conta
        </div>
        {MENU.map(item => (
          <div key={item.label} className="ns-menu-row">
            <div className="ns-menu-icon" style={{ background: 'var(--ns-bg-2)' }}>{item.emoji}</div>
            <span className="ns-menu-text">{item.label}</span>
            {item.right && (
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 1l5 5-5 5" stroke="var(--ns-t-6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {item.badge && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: 'var(--ns-bg-2)', color: 'var(--ns-t-3)',
                padding: '3px 9px', borderRadius: 20,
              }}>
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}

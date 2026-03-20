import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';

const GOALS = [
  { key: 'Calorias',    pct: 100, value: '2.732 kcal' },
  { key: 'Proteína',    pct: 38,  value: '150g/dia'   },
  { key: 'Carboidrato', pct: 65,  value: '260g/dia'   },
  { key: 'Gordura',     pct: 21,  value: '82g/dia'    },
  { key: 'Hidratação',  pct: 55,  value: '2.625ml',   isWater: true },
];

const ACHIEVEMENTS = [
  { emoji: '🔥', label: '5 dias'     },
  { emoji: '📸', label: '10 scans'   },
  { emoji: '💧', label: 'Hidratação' },
  { emoji: '🎯', label: 'Meta'       },
];

const MENU = [
  { emoji: '👤', label: 'Dados pessoais',    right: true  },
  { emoji: '🎯', label: 'Metas e objetivos', right: true  },
  { emoji: '🤖', label: 'Modelo de IA',      badge: 'Groq' },
  { emoji: '🔔', label: 'Notificações',      badge: '2 novas' },
  { emoji: '🔒', label: 'Privacidade',       right: true  },
  { emoji: '⚙️', label: 'Preferências',      right: true  },
];

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function bmiLabel(bmi) {
  if (!bmi) return '—';
  const v = parseFloat(bmi);
  if (v < 18.5) return 'Abaixo';
  if (v < 25)   return 'Normal';
  if (v < 30)   return 'Acima';
  return 'Obeso';
}

// Chevron SVG
const Chevron = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 1l5 5-5 5" stroke="#C0C0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const name    = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário';
  const email   = user?.email ?? '';
  const initial = name.charAt(0).toUpperCase();

  const age    = profile?.age    ?? '—';
  const height = profile?.height ?? '—';
  const weight = profile?.weight ?? '—';
  const bmi    = calcBMI(profile?.weight, profile?.height);
  const bmiStr = bmi ?? '—';

  // Stats fictícios
  const scansCount  = 24;
  const streakCount = 5;
  const daysCount   = 12;

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      {/* ── Avatar centralizado ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#F5F5F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 800, color: '#000',
          border: '0.5px solid rgba(0,0,0,0.08)',
        }}>
          {initial}
        </div>
        <div style={{
          fontSize: 24, fontWeight: 800, color: '#000',
          letterSpacing: '-0.04em', lineHeight: 1.1,
          marginTop: 12, textAlign: 'center',
        }}>
          {name}
        </div>
        <div style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4, textAlign: 'center' }}>
          {profile?.goal ?? 'Manutenção'}
        </div>
        <div style={{ fontSize: 13, color: '#B0B0B0', marginTop: 2, textAlign: 'center' }}>
          {email}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, width: '100%', maxWidth: 320 }}>
          {[
            { v: scansCount,  l: 'Scans'  },
            { v: streakCount, l: 'Streak' },
            { v: daysCount,   l: 'Dias'   },
          ].map(({ v, l }, i) => (
            <div key={l} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < 2 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
              padding: '0 8px',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#000', letterSpacing: '-0.04em' }}>
                {v}
              </div>
              <div style={{ fontSize: 11, color: '#B0B0B0', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Biometrics 2x2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '20px 20px 0' }}>
        {[
          ['Idade',  age,    age    === '—' ? '' : 'anos'],
          ['Altura', height, height === '—' ? '' : 'cm'],
          ['Peso',   weight, weight === '—' ? '' : 'kg'],
          ['IMC',    bmiStr, bmiLabel(bmi)],
        ].map(([l, v, u]) => (
          <div key={l} style={{
            background: '#F5F5F5',
            borderRadius: 12,
            padding: '12px 8px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div style={{ fontSize: 10, color: '#B0B0B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {l}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#000', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {v}
            </div>
            <div style={{ fontSize: 10, color: '#B0B0B0' }}>{u}</div>
          </div>
        ))}
      </div>

      {/* ── Metas diárias — iOS grouped list ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#B0B0B0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Metas diárias
        </div>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          border: '0.5px solid rgba(0,0,0,0.08)',
        }}>
          {GOALS.map((g, i) => (
            <div key={g.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: '#000', flex: 1, fontWeight: 500 }}>{g.key}</span>
              <div style={{ width: 80, height: 3, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${g.pct}%`,
                  background: g.isWater ? '#2563EB' : '#000',
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#000', letterSpacing: '-0.02em', minWidth: 72, textAlign: 'right' }}>
                {g.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Conquistas ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#B0B0B0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Conquistas
        </div>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '0.5px solid rgba(0,0,0,0.08)',
          padding: '16px',
          display: 'flex', gap: 8,
        }}>
          {ACHIEVEMENTS.map(a => (
            <div key={a.label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#F5F5F5',
                border: '0.5px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {a.emoji}
              </div>
              <div style={{ fontSize: 11, color: '#6B6B6B', textAlign: 'center', fontWeight: 500 }}>
                {a.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu de configurações — iOS style ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#B0B0B0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Conta
        </div>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          border: '0.5px solid rgba(0,0,0,0.08)',
        }}>
          {MENU.map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px',
              borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#F5F5F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                {item.emoji}
              </div>
              <span style={{ flex: 1, fontSize: 15, color: '#000', fontWeight: 500 }}>
                {item.label}
              </span>
              {item.right && <Chevron />}
              {item.badge && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: '#F5F5F5', color: '#6B6B6B',
                  padding: '3px 9px', borderRadius: 20,
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Botão Sair ── */}
      <div style={{ margin: '16px 20px 24px' }}>
        <button
          onClick={signOut}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            border: '1px solid #DC2626',
            background: 'transparent',
            color: '#DC2626',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: '-0.01em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          🚪 Sair da conta
        </button>
      </div>
    </div>
  );
}

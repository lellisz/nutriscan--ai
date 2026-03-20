import { useState } from 'react';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';

const GOALS = [
  { key: 'Calorias',    pct: 100, value: '2.732 kcal' },
  { key: 'Proteína',    pct: 38,  value: '150g/dia'   },
  { key: 'Carboidrato', pct: 65,  value: '260g/dia'   },
  { key: 'Gordura',     pct: 21,  value: '82g/dia'    },
];

// ── Ícones SVG para conquistas ─────────────────────────────
const IconFlame = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17c-3.3 0-6-2.5-6-5.5 0-2 1.2-3.8 2.5-5C7.8 5 8.5 3.2 8 1.5 10.5 2.5 14 5.5 14 9c.8-.5 1.5-1.5 1.5-2.5 1 1.2 1.5 2.7 1.5 4C17 14.5 13.8 17 10 17z" />
  </svg>
);

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6.5A1.5 1.5 0 013.5 5h1l1.5-2h8l1.5 2h1A1.5 1.5 0 0118 6.5v8A1.5 1.5 0 0116.5 16h-13A1.5 1.5 0 012 14.5v-8z" />
    <circle cx="10" cy="10.5" r="2.5" />
  </svg>
);

const IconDropAchievement = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.5C10 2.5 4.5 9 4.5 13a5.5 5.5 0 0011 0C15.5 9 10 2.5 10 2.5z" />
  </svg>
);

const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2l2.4 5 5.6.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5-4-3.9 5.6-.8z" />
  </svg>
);

// ── Ícones SVG para menu de configurações ──────────────────
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="6.5" r="3" />
    <path d="M3.5 17.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
  </svg>
);

const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <circle cx="10" cy="10" r="4.5" />
    <circle cx="10" cy="10" r="1.5" />
  </svg>
);

const IconChip = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="10" height="10" rx="1.5" />
    <path d="M7.5 5V3M10 5V3M12.5 5V3" />
    <path d="M7.5 17v-2M10 17v-2M12.5 17v-2" />
    <path d="M5 7.5H3M5 10H3M5 12.5H3" />
    <path d="M17 7.5h-2M17 10h-2M17 12.5h-2" />
  </svg>
);

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.5a5.5 5.5 0 00-5.5 5.5c0 2.5-.5 4-1.5 5h14c-1-1-1.5-2.5-1.5-5A5.5 5.5 0 0010 2.5z" />
    <path d="M8.5 13a1.5 1.5 0 003 0" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2L3.5 5v5c0 4 2.8 7.5 6.5 8.5 3.7-1 6.5-4.5 6.5-8.5V5L10 2z" />
  </svg>
);

const IconGear = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.4 4.6l-1.3 1.3M5.9 14.1l-1.3 1.3M15.4 15.4l-1.3-1.3M5.9 5.9L4.6 4.6" />
  </svg>
);

const ACHIEVEMENTS = [
  { Icon: IconFlame,          label: '5 dias'     },
  { Icon: IconCamera,         label: '10 scans'   },
  { Icon: IconDropAchievement, label: 'Hidratação' },
  { Icon: IconStar,           label: 'Meta'       },
];

const MENU = [
  { icon: IconPerson, label: 'Dados pessoais',    right: true    },
  { icon: IconTarget, label: 'Metas e objetivos', right: true    },
  { icon: IconChip,   label: 'Modelo de IA',      badge: 'Groq'  },
  { icon: IconBell,   label: 'Notificações',      badge: '2 novas' },
  { icon: IconShield, label: 'Privacidade',        right: true    },
  { icon: IconGear,   label: 'Preferências',       right: true    },
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

// ── Ícones SVG inline para biometrics ─────────────────────
const IconCake = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8" />
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1" />
    <path d="M2 21h20" />
    <path d="M7 8v2" />
    <path d="M12 8v2" />
    <path d="M17 8v2" />
    <path d="M7 4l1 4" />
    <path d="M12 4v4" />
    <path d="M17 4l-1 4" />
  </svg>
);

const IconRuler = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 15.3a1 1 0 010 1.4l-2.6 2.6a1 1 0 01-1.4 0L2.7 4.7a1 1 0 010-1.4l2.6-2.6a1 1 0 011.4 0z" />
    <path d="M14 7l-3 3" />
    <path d="M10 11l-2 2" />
    <path d="M6 15l-2 2" />
    <path d="M18 3l-3 3" />
  </svg>
);

const IconScale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z" />
    <path d="M12 8v4l2 2" />
  </svg>
);

const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconDrop = () => (
  <svg width="14" height="16" viewBox="0 0 10 13" fill="none">
    <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
      fill="rgba(37,99,235,0.12)"
      stroke="#2563EB" strokeWidth="1.4" />
  </svg>
);

// ── Chevron SVG ────────────────────────────────────────────
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

  // Hidratação
  const [waterMl, setWaterMl] = useState(800);
  const waterGoal = 2625;
  const waterPct  = Math.min(Math.round((waterMl / waterGoal) * 100), 100);

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      {/* ── Topo: avatar + nome + stats ── */}
      <div style={{
        background: 'linear-gradient(180deg, #F5F5F5 0%, #FFFFFF 100%)',
        padding: '24px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 800, color: '#000',
          border: '0.5px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {initial}
        </div>

        {/* Nome e objetivo */}
        <div style={{
          fontSize: 22, fontWeight: 700, color: '#000',
          letterSpacing: '-0.03em', lineHeight: 1.15,
          marginTop: 12, textAlign: 'center',
        }}>
          {name}
        </div>
        <div style={{ fontSize: 13, color: '#9A9A9A', marginTop: 4, textAlign: 'center' }}>
          {profile?.goal ?? 'Manutenção'}
        </div>
        <div style={{ fontSize: 12, color: '#B0B0B0', marginTop: 2, textAlign: 'center' }}>
          {email}
        </div>

        {/* Stats row — agrupado em retângulo */}
        <div style={{
          display: 'flex',
          background: '#F5F5F5',
          borderRadius: 16,
          padding: '16px 0',
          marginTop: 20,
          width: '100%',
        }}>
          {[
            { v: scansCount,  l: 'Scans'  },
            { v: streakCount, l: 'Streak' },
            { v: daysCount,   l: 'Dias'   },
          ].map(({ v, l }, i) => (
            <div key={l} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
            }}>
              <div style={{
                fontSize: 22, fontWeight: 800, color: '#000',
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {v}
              </div>
              <div style={{
                fontSize: 10, color: '#B0B0B0', marginTop: 3,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Biometrics — retângulo único com grid interno ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          background: '#F5F5F5',
          borderRadius: 16,
          padding: 16,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { l: 'Idade',  v: age,    u: age    === '—' ? '' : 'anos', Icon: IconCake  },
              { l: 'Altura', v: height, u: height === '—' ? '' : 'cm',   Icon: IconRuler },
              { l: 'Peso',   v: weight, u: weight === '—' ? '' : 'kg',   Icon: IconScale },
              { l: 'IMC',    v: bmiStr, u: bmiLabel(bmi),                Icon: IconChart },
            ].map(({ l, v, u, Icon }, i) => (
              <div key={l} style={{
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                borderRight: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                padding: '4px 0',
              }}>
                <Icon />
                <div style={{
                  fontSize: 18, fontWeight: 800, color: '#000',
                  letterSpacing: '-0.04em', lineHeight: 1,
                }}>
                  {v}
                </div>
                <div style={{
                  fontSize: 10, color: '#9A9A9A',
                  fontWeight: 500, lineHeight: 1.2, textAlign: 'center',
                }}>
                  {u || l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hidratação ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          background: '#F5F5F5',
          borderRadius: 16,
          padding: 16,
        }}>
          {/* Cabeçalho */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconDrop />
              <span style={{
                fontSize: 14, fontWeight: 700, color: '#000', letterSpacing: '-0.02em',
              }}>
                Hidratação
              </span>
            </div>
            <span style={{ fontSize: 13, color: '#9A9A9A', fontWeight: 500 }}>
              meta {waterGoal.toLocaleString('pt-BR')}ml
            </span>
          </div>

          {/* Barra de progresso grossa */}
          <div style={{ height: 8, background: '#E8E8E8', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${waterPct}%`,
              background: '#2563EB',
              borderRadius: 4,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>

          {/* Rodapé: texto + botão */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginTop: 10,
          }}>
            <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>
              {waterMl.toLocaleString('pt-BR')}ml de {waterGoal.toLocaleString('pt-BR')}ml
            </span>
            <button
              onClick={() => setWaterMl(prev => Math.min(prev + 250, waterGoal))}
              style={{
                background: '#EFF6FF',
                color: '#2563EB',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                letterSpacing: '-0.01em',
              }}
            >
              + 250ml
            </button>
          </div>
        </div>
      </div>

      {/* ── Metas diárias ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#000',
          letterSpacing: '-0.02em', marginBottom: 8,
        }}>
          Minhas metas
        </div>
        <div style={{
          background: '#F5F5F5',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {GOALS.map((g, i) => (
            <div key={g.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 14, color: '#000', flex: 1, fontWeight: 500 }}>{g.key}</span>
              <div style={{ width: 72, height: 3, background: '#E8E8E8', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${g.pct}%`,
                  background: g.isWater ? '#2563EB' : '#000',
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{
                fontSize: 14, fontWeight: 600, color: '#6B6B6B',
                letterSpacing: '-0.02em', minWidth: 72, textAlign: 'right',
              }}>
                {g.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Conquistas ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#000',
          letterSpacing: '-0.02em', marginBottom: 8,
        }}>
          Conquistas
        </div>
        <div style={{
          background: '#F5F5F5',
          borderRadius: 16,
          padding: 16,
          display: 'flex', gap: 8,
        }}>
          {ACHIEVEMENTS.map(a => (
            <div key={a.label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <a.Icon />
              </div>
              <div style={{
                fontSize: 10, color: '#9A9A9A', textAlign: 'center', fontWeight: 500,
              }}>
                {a.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu de configurações — iOS style ── */}
      <div style={{ margin: '16px 20px 0' }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#000',
          letterSpacing: '-0.02em', marginBottom: 8,
        }}>
          Conta
        </div>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          {MENU.map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px',
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#F5F5F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <item.icon />
              </div>
              <span style={{ flex: 1, fontSize: 15, color: '#000', fontWeight: 500 }}>
                {item.label}
              </span>
              {item.right && <Chevron />}
              {item.badge && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: '#F5F5F5', color: '#6B6B6B',
                  padding: '3px 8px', borderRadius: 10,
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Botão Sair ── */}
      <div style={{ margin: '20px 0 24px' }}>
        <button
          onClick={signOut}
          style={{
            width: 'calc(100% - 40px)',
            margin: '0 20px',
            height: 48,
            borderRadius: 14,
            border: '1px solid rgba(220,38,38,0.2)',
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
          Sair da conta
        </button>
      </div>
    </div>
  );
}

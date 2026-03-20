import { useState } from 'react';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';

// ── Triple Ring ────────────────────────────────────────────
function TripleRing({ calories = 0, goal = 2732, protein = 0, water = 0 }) {
  const calPct   = Math.min(calories / goal, 1);
  const protPct  = Math.min(protein / 150, 1);
  const waterPct = Math.min(water / 2625, 1);

  const arc = (r, pct) => {
    const circ = 2 * Math.PI * r;
    return `${circ * pct} ${circ * (1 - pct) + circ}`;
  };

  return (
    <div style={{ flexShrink: 0, position: 'relative', width: 130, height: 130 }}>
      {/* Glow ambiental */}
      <div style={{
        position: 'absolute', inset: 10,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(48,209,88,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <svg style={{ position: 'absolute', inset: 0 }} width="130" height="130" viewBox="0 0 130 130">
        {/* Track rings */}
        <circle cx="65" cy="65" r="59" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx="65" cy="65" r="47" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="65" cy="65" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />

        {/* Calorias — verde */}
        <circle cx="65" cy="65" r="59" fill="none" stroke="#30D158" strokeWidth="7"
          strokeDasharray={arc(59, calPct)} strokeLinecap="round"
          strokeDashoffset="93" opacity="1"
          style={{ filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.5))' }} />

        {/* Proteína — laranja */}
        <circle cx="65" cy="65" r="47" fill="none" stroke="#FF6B35" strokeWidth="6"
          strokeDasharray={arc(47, protPct)} strokeLinecap="round"
          strokeDashoffset="74" opacity=".9"
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,107,53,0.45))' }} />

        {/* Água — azul */}
        <circle cx="65" cy="65" r="36" fill="none" stroke="#0A84FF" strokeWidth="5"
          strokeDasharray={arc(36, waterPct)} strokeLinecap="round"
          strokeDashoffset="57" opacity=".85"
          style={{ filter: 'drop-shadow(0 0 3px rgba(10,132,255,0.45))' }} />
      </svg>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 26, fontWeight: 800, color: '#ffffff',
          letterSpacing: '-0.05em', lineHeight: 1,
        }}>
          {calories}
        </div>
        <div style={{ fontSize: 10, color: '#636366', letterSpacing: '-0.01em', marginTop: 2 }}>kcal</div>
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────
function Sparkline({ data = [8,12,6,14,10,13,8], color = 'var(--ns-t-1)' }) {
  const max = Math.max(...data);
  const points = data.map((v, i) => `${i * 8},${14 - (v / max) * 13}`).join(' ');
  const last   = data[data.length - 1];
  const lastY  = 14 - (last / max) * 13;

  return (
    <svg style={{ width: '100%', height: 14 }} viewBox="0 0 50 14" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1"
        opacity=".35" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy={lastY} r="1.5" fill={color} opacity=".5" />
    </svg>
  );
}

// ── Macro Card ────────────────────────────────────────────
function MacroCard({ label, value, goal, color, unit = 'g', sparkData }) {
  const pct = goal > 0 ? Math.round((value / goal) * 100) : 0;

  return (
    <div
      className="ns-macro-card ns-shimmer"
      style={{
        background: '#111111',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '14px 12px',
      }}
    >
      <div className="ns-macro-header" style={{ marginBottom: 6 }}>
        <div className="ns-macro-dot" style={{ background: color, width: 6, height: 6, borderRadius: '50%' }} />
        <span className="ns-macro-pct" style={{ fontSize: 11, color: '#636366', letterSpacing: '-0.01em' }}>{pct}%</span>
      </div>
      <div
        className="ns-macro-value"
        style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}
      >
        {value}
        <span style={{ fontSize: 12, fontWeight: 500, color: '#636366' }}>{unit}</span>
      </div>
      <div
        className="ns-macro-of"
        style={{ fontSize: 10, color: '#48484a', letterSpacing: '-0.01em', marginTop: 2 }}
      >
        /{goal}{unit}
      </div>
      <div
        className="ns-macro-name"
        style={{ fontSize: 11, color: '#8e8e93', letterSpacing: '-0.02em', marginTop: 6, marginBottom: 4 }}
      >
        {label}
      </div>
      <Sparkline data={sparkData} color={color} />
      <div
        className="ns-bar-track"
        style={{
          marginTop: 6, height: 3, borderRadius: 3,
          background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
        }}
      >
        <div
          className="ns-bar-fill"
          style={{
            width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`,
            height: '100%', borderRadius: 3,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────
function MiniBarChart({ data = [], highlight = 'var(--ns-t-2)', height = 28 }) {
  const max = Math.max(...data, 1);
  const days = ['T', 'Q', 'Q', 'S', 'S', 'D', 'S'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {data.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: i === data.length - 1 ? highlight : 'var(--ns-bg-2)',
            height: `${(v / max) * 100}%`,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        {days.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: 7, fontWeight: 600,
            color: i === days.length - 1 ? highlight : 'var(--ns-t-6)',
          }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────
function Timeline({ meals = [] }) {
  return (
    <div>
      <div className="ns-timeline">
        <div className="ns-timeline-line" />
        {meals.map((meal, i) => (
          <div key={i} className="ns-timeline-event" style={{ left: `${meal.timePercent}%` }}>
            <div style={{
              fontSize: 7, color: 'var(--ns-t-4)', fontWeight: 600,
              textAlign: 'center', marginBottom: 2, whiteSpace: 'nowrap',
            }}>
              {meal.calories} kcal
            </div>
            <div className="ns-timeline-dot">{meal.emoji}</div>
          </div>
        ))}
        <div className="ns-timeline-now" style={{ left: '60%' }} />
      </div>
      <div className="ns-timeline-axis">
        {['00h', '06h', '12h', '18h', '24h'].map(t => (
          <div key={t} className="ns-timeline-tick">{t}</div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuário';

  const goalCal = profile?.daily_goals?.calories ?? 2732;
  const [todayData] = useState({
    calories: 535,
    protein: 42,
    carbs: 45,
    fat: 10,
    water: 800,
  });

  const weekData = [1650, 1840, 980, 2100, 1720, 1980, todayData.calories];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const streakDays = ['S','T','Q','Q','S','S','D'];
  const doneCount  = 5;

  const mockMeals = [
    { emoji: '🍚', calories: 215, timePercent: 33 },
    { emoji: '🍗', calories: 320, timePercent: 80 },
  ];

  const remaining = goalCal - todayData.calories;
  const calPct = Math.round((todayData.calories / goalCal) * 100);

  return (
    <div className="ns-page" style={{ background: '#000000' }}>
      <StatusBar />

      <div className="ns-px" style={{ paddingTop: 20, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Greeting ── */}
        <div style={{
          fontSize: 13, color: '#636366',
          letterSpacing: '-0.02em', marginBottom: 4,
          textTransform: 'capitalize',
        }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: '#ffffff',
          letterSpacing: '-0.05em', lineHeight: 1.02, marginBottom: 12,
        }}>
          {greeting()},<br />{firstName}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <div className="ns-chip" style={{ background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: 20, padding: '4px 10px' }}>
            <div className="ns-chip-dot" style={{ background: '#30D158', width: 5, height: 5, borderRadius: '50%', marginRight: 5 }} />
            <span className="ns-chip-text" style={{ fontSize: 12, fontWeight: 600, color: '#30D158', letterSpacing: '-0.02em' }}>Manutenção</span>
          </div>
          <div className="ns-chip" style={{ background: 'rgba(255,159,10,0.1)', border: '0.5px solid rgba(255,159,10,0.2)', borderRadius: 20, padding: '4px 10px' }}>
            <span className="ns-chip-text" style={{ fontSize: 12, fontWeight: 600, color: '#FF9F0A', letterSpacing: '-0.02em' }}>{doneCount} dias streak</span>
          </div>
        </div>

        {/* ── Hero Ring Card ── */}
        <div
          className="ns-card ns-shimmer"
          style={{
            padding: 22, marginBottom: 12,
            background: '#111111',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <TripleRing
              calories={todayData.calories}
              goal={goalCal}
              protein={todayData.protein}
              water={todayData.water}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#636366', letterSpacing: '-0.02em', marginBottom: 4, fontWeight: 500 }}>
                Restam hoje
              </div>
              <div style={{
                fontSize: 48, fontWeight: 800, color: '#ffffff',
                letterSpacing: '-0.06em', lineHeight: 1,
              }}>
                {remaining.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 12, color: '#48484a', letterSpacing: '-0.02em', marginTop: 4 }}>
                de {goalCal.toLocaleString('pt-BR')} kcal · {calPct}%
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {[
                  ['#30D158',  'Calorias', `${todayData.calories}/${goalCal}`],
                  ['#FF6B35',  'Proteína', `${todayData.protein}/150g`],
                  ['#0A84FF',  'Água',     `${todayData.water}/2.625ml`],
                ].map(([c, l, v]) => (
                  <div key={l} className="ns-ring-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      className="ns-ring-legend-dot"
                      style={{
                        background: c, width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        boxShadow: `0 0 5px ${c}66`,
                      }}
                    />
                    <span className="ns-ring-legend-label" style={{ fontSize: 11, color: '#8e8e93', flex: 1, letterSpacing: '-0.01em' }}>{l}</span>
                    <span className="ns-ring-legend-value" style={{ fontSize: 11, color: '#ebebf0', fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div style={{
            display: 'flex', gap: 5, marginTop: 18, paddingTop: 16,
            borderTop: '0.5px solid rgba(255,255,255,0.06)', alignItems: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#636366', letterSpacing: '-0.01em', marginRight: 4, fontWeight: 500 }}>Sequência</div>
            {streakDays.map((d, i) => (
              <div
                key={i}
                className={`ns-streak-day ${
                  i === streakDays.length - 1 ? 'ns-streak-day--today' :
                  i < doneCount ? 'ns-streak-day--done' : 'ns-streak-day--miss'
                }`}
                style={{
                  width: 26, height: 26, borderRadius: 8, fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === streakDays.length - 1
                    ? '#30D158'
                    : i < doneCount
                    ? 'rgba(48,209,88,0.18)'
                    : 'rgba(255,255,255,0.05)',
                  color: i === streakDays.length - 1
                    ? '#000'
                    : i < doneCount
                    ? '#30D158'
                    : '#48484a',
                }}
              >
                {d}
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{
              fontSize: 12, color: '#30D158', letterSpacing: '-0.02em', fontWeight: 700,
            }}>
              {doneCount}d
            </div>
          </div>
        </div>

        {/* ── Seção: Macros ── */}
        <div style={{ marginBottom: 6 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#ffffff',
            letterSpacing: '-0.04em', marginBottom: 12,
          }}>
            Macros de hoje
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <MacroCard label="Proteína"    value={todayData.protein} goal={150} color="#FF6B35" sparkData={[5,8,4,9,6,8,todayData.protein]} />
            <MacroCard label="Carboidrato" value={todayData.carbs}   goal={260} color="#FFD60A" sparkData={[6,9,5,11,8,10,todayData.carbs]} />
            <MacroCard label="Gordura"     value={todayData.fat}     goal={82}  color="#BF5AF2" sparkData={[4,6,5,7,6,8,todayData.fat]} />
          </div>
        </div>

        {/* ── Scan CTA ── */}
        <div
          className="ns-scan-cta ns-shimmer"
          style={{
            marginBottom: 12,
            background: '#111111',
            border: '0.5px solid rgba(48,209,88,0.20)',
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div
            className="ns-scan-icon"
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(48,209,88,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0,
            }}
          >
            <div className="ns-scan-icon-pulse" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 9V5h4" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 9V5h-4" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v4h4" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 15v4h-4" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" stroke="#30D158" strokeWidth="1.8" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="ns-scan-tag" style={{ fontSize: 11, color: '#30D158', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>IA Pronta</div>
            <div className="ns-scan-title" style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em' }}>Escanear alimento</div>
          </div>
          <div
            className="ns-scan-arrow"
            style={{
              width: 28, height: 28, borderRadius: 9,
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5l4 3.5-4 3.5" stroke="#8e8e93" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* ── Seção: Semana ── */}
        <div style={{ marginBottom: 6 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#ffffff',
            letterSpacing: '-0.04em', marginBottom: 12,
          }}>
            Esta semana
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div
              className="ns-card-sm ns-shimmer"
              style={{
                padding: 16, background: '#111111',
                border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#636366', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Média 7 dias</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#ffffff',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>
                {Math.round(weekData.reduce((a, b) => a + b, 0) / weekData.length).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 11, color: '#48484a', marginTop: 3, letterSpacing: '-0.01em' }}>kcal/dia</div>
              <div style={{ marginTop: 10 }}>
                <MiniBarChart data={weekData} highlight="#30D158" height={32} />
              </div>
            </div>

            <div
              className="ns-card-sm ns-shimmer"
              style={{
                padding: 16, background: '#111111',
                border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#636366', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Déficit</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#FF9F0A',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>
                {remaining.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 11, color: '#48484a', marginTop: 3, letterSpacing: '-0.01em' }}>kcal restantes</div>
              <div style={{ marginTop: 12 }}>
                <div style={{
                  height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)',
                  overflow: 'hidden', marginBottom: 6,
                }}>
                  <div style={{
                    width: `${calPct}%`, height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #FF9F0Aaa, #FF9F0A)',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{
                  height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(todayData.protein / 150) * 100}%`, height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #FF6B35aa, #FF6B35)',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 9, color: '#48484a', marginTop: 5, letterSpacing: '-0.01em' }}>Cal · Prot</div>
            </div>

            <div
              className="ns-card-sm ns-shimmer"
              style={{
                gridColumn: '1/-1', padding: '16px 18px',
                background: '#111111',
                border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em' }}>Linha do tempo</div>
                <div style={{ fontSize: 11, color: '#636366', letterSpacing: '-0.01em' }}>{mockMeals.length} refeições</div>
              </div>
              <Timeline meals={mockMeals} />
            </div>
          </div>
        </div>

        {/* ── Seção: Hidratação ── */}
        <div style={{ marginBottom: 4 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: '#ffffff',
            letterSpacing: '-0.04em', marginBottom: 12,
          }}>
            Hidratação
          </div>
          <div
            className="ns-card-sm ns-shimmer"
            style={{
              padding: '16px 18px', marginBottom: 20,
              background: '#111111',
              border: '0.5px solid rgba(10,132,255,0.15)', borderRadius: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontSize: 30, fontWeight: 800, color: '#0A84FF',
                  letterSpacing: '-0.05em', lineHeight: 1,
                }}>
                  {todayData.water}
                </span>
                <span style={{ fontSize: 12, color: '#48484a', letterSpacing: '-0.02em' }}>ml</span>
              </div>
              <div style={{ fontSize: 12, color: '#48484a', letterSpacing: '-0.02em' }}>
                meta 2.625ml
              </div>
            </div>
            <div style={{
              height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)',
              overflow: 'hidden', marginBottom: 14,
            }}>
              <div style={{
                width: `${(todayData.water / 2625) * 100}%`, height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, #0A84FFaa, #0A84FF)',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.floor((todayData.water / 2625) * 5);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: 38, borderRadius: 12,
                      background: filled ? 'rgba(10,132,255,0.18)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      border: filled ? '0.5px solid rgba(10,132,255,0.4)' : '0.5px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <svg width="11" height="14" viewBox="0 0 10 13" fill="none">
                      <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
                        fill={filled ? 'rgba(10,132,255,0.3)' : 'none'}
                        stroke={filled ? '#0A84FF' : '#48484a'} strokeWidth="1.2" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

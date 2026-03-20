import { useState } from 'react';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';

// ── Progress Ring (calorias) ───────────────────────────────
function CalorieRing({ calories = 0, goal = 2732 }) {
  const pct = Math.min(calories / goal, 1);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const gap  = circ * (1 - pct) + circ;

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg style={{ position: 'absolute', inset: 0 }} width="130" height="130" viewBox="0 0 130 130">
        {/* Track */}
        <circle cx="65" cy="65" r={r} fill="none" stroke="#E8E8E8" strokeWidth="8" />
        {/* Fill verde */}
        <circle cx="65" cy="65" r={r} fill="none" stroke="#16A34A" strokeWidth="8"
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#000', letterSpacing: '-0.05em', lineHeight: 1 }}>
          {calories}
        </div>
        <div style={{ fontSize: 10, color: '#B0B0B0', marginTop: 2 }}>kcal</div>
      </div>
    </div>
  );
}

// ── Macro Card ────────────────────────────────────────────
function MacroCard({ label, value, goal, unit = 'g' }) {
  const pct = goal > 0 ? Math.min(Math.round((value / goal) * 100), 100) : 0;

  return (
    <div style={{
      background: '#F5F5F5',
      borderRadius: 14,
      padding: '14px 12px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 11, color: '#B0B0B0', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 800, color: '#000',
        letterSpacing: '-0.04em', marginTop: 4, lineHeight: 1,
      }}>
        {value}<span style={{ fontSize: 12, fontWeight: 500, color: '#B0B0B0' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>de {goal}{unit}</div>
      <div style={{ height: 3, background: '#E8E8E8', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#000', borderRadius: 2,
          width: `${pct}%`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────
function MiniBarChart({ data = [], height = 28 }) {
  const max = Math.max(...data, 1);
  const days = ['T', 'Q', 'Q', 'S', 'S', 'D', 'S'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {data.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: i === data.length - 1 ? '#000' : '#E8E8E8',
            height: `${(v / max) * 100}%`,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        {days.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', fontSize: 7, fontWeight: 600,
            color: i === days.length - 1 ? '#000' : '#C0C0C0',
          }}>{d}</div>
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

  const remaining = goalCal - todayData.calories;
  const calPct    = Math.round((todayData.calories / goalCal) * 100);
  const waterPct  = Math.round((todayData.water / 2625) * 100);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      <div style={{ padding: '20px 20px 0' }}>

        {/* ── Greeting ── */}
        <div style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 4, textTransform: 'capitalize' }}>
          {today}
        </div>
        <div style={{
          fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em',
          color: '#000', lineHeight: 1.1, marginBottom: 20,
        }}>
          {greeting()}, {firstName} 👋
        </div>

        {/* ── Hero Card de Calorias ── */}
        <div style={{
          background: '#F5F5F5', borderRadius: 20,
          padding: 22, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <CalorieRing calories={todayData.calories} goal={goalCal} />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4, fontWeight: 500 }}>
                Restam hoje
              </div>
              <div style={{
                fontSize: 48, fontWeight: 800, color: '#000',
                letterSpacing: '-0.06em', lineHeight: 1,
              }}>
                {remaining.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 12, color: '#B0B0B0', marginTop: 4 }}>
                de {goalCal.toLocaleString('pt-BR')} kcal
              </div>

              {/* Badge percentual */}
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#F0FDF4', borderRadius: 20,
                padding: '4px 10px', marginTop: 10,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A', marginRight: 6 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>{calPct}% consumido</span>
              </div>
            </div>
          </div>

          {/* Barra de progresso de calorias */}
          <div style={{ marginTop: 18 }}>
            <div style={{ height: 4, background: '#E8E8E8', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: '#16A34A', borderRadius: 4,
                width: `${calPct}%`,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {/* Streak */}
          <div style={{
            display: 'flex', gap: 5, marginTop: 16, paddingTop: 14,
            borderTop: '0.5px solid rgba(0,0,0,0.06)', alignItems: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#B0B0B0', marginRight: 4, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Sequência
            </div>
            {streakDays.map((d, i) => (
              <div
                key={i}
                style={{
                  width: 26, height: 26, borderRadius: 8, fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === streakDays.length - 1
                    ? '#16A34A'
                    : i < doneCount
                    ? '#F0FDF4'
                    : '#F5F5F5',
                  color: i === streakDays.length - 1
                    ? '#FFFFFF'
                    : i < doneCount
                    ? '#16A34A'
                    : '#C0C0C0',
                  border: i === streakDays.length - 1
                    ? 'none'
                    : i < doneCount
                    ? '0.5px solid rgba(22,163,74,0.25)'
                    : '0.5px solid rgba(0,0,0,0.06)',
                }}
              >
                {d}
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
              {doneCount}d
            </div>
          </div>
        </div>

        {/* ── Seção: Macros ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#000',
            letterSpacing: '-0.04em', marginBottom: 12,
          }}>
            Macros de hoje
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <MacroCard label="Proteína"    value={todayData.protein} goal={150} />
            <MacroCard label="Carboidrato" value={todayData.carbs}   goal={260} />
            <MacroCard label="Gordura"     value={todayData.fat}     goal={82}  />
          </div>
        </div>

        {/* ── Scan CTA ── */}
        <div style={{
          marginBottom: 12, background: '#F5F5F5',
          borderRadius: 16, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          WebkitTapHighlightColor: 'transparent', cursor: 'pointer',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 9V5h4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 9V5h-4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v4h4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 15v4h-4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" stroke="#FFF" strokeWidth="1.8" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>
              IA Pronta
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#000', letterSpacing: '-0.03em' }}>
              Escanear alimento
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5l4 3.5-4 3.5" stroke="#B0B0B0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* ── Seção: Esta semana ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#000',
            letterSpacing: '-0.04em', marginBottom: 12,
          }}>
            Esta semana
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: 16, background: '#F5F5F5', borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500, marginBottom: 8 }}>Média 7 dias</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#000',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>
                {Math.round(weekData.reduce((a, b) => a + b, 0) / weekData.length).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 11, color: '#B0B0B0', marginTop: 3 }}>kcal/dia</div>
              <div style={{ marginTop: 10 }}>
                <MiniBarChart data={weekData} height={32} />
              </div>
            </div>

            <div style={{ padding: 16, background: '#F5F5F5', borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500, marginBottom: 8 }}>Restante</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#000',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>
                {remaining.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 11, color: '#B0B0B0', marginTop: 3 }}>kcal restantes</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, borderRadius: 4, background: '#E8E8E8', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: `${calPct}%`, height: '100%', borderRadius: 4, background: '#000',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{ height: 4, borderRadius: 4, background: '#E8E8E8', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round((todayData.protein / 150) * 100)}%`,
                    height: '100%', borderRadius: 4, background: '#000',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{ fontSize: 9, color: '#B0B0B0', marginTop: 5 }}>Cal · Prot</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção: Hidratação ── */}
        <div style={{ marginBottom: 4 }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#000',
            letterSpacing: '-0.04em', marginBottom: 12,
          }}>
            Hidratação
          </div>
          <div style={{ padding: '16px 18px', background: '#F5F5F5', borderRadius: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#000', letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {todayData.water}
                </span>
                <span style={{ fontSize: 12, color: '#B0B0B0' }}>ml</span>
              </div>
              <div style={{ fontSize: 12, color: '#B0B0B0' }}>meta 2.625ml</div>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: '#E8E8E8', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{
                width: `${waterPct}%`, height: '100%', borderRadius: 4,
                background: '#2563EB',
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
                      background: filled ? 'rgba(37,99,235,0.08)' : 'rgba(0,0,0,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      border: filled ? '0.5px solid rgba(37,99,235,0.25)' : '0.5px solid rgba(0,0,0,0.06)',
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <svg width="11" height="14" viewBox="0 0 10 13" fill="none">
                      <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
                        fill={filled ? 'rgba(37,99,235,0.2)' : 'none'}
                        stroke={filled ? '#2563EB' : '#C0C0C0'} strokeWidth="1.2" />
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

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
    <div style={{ flexShrink: 0, position: 'relative', width: 110, height: 110 }}>
      <svg
        style={{ position: 'absolute', inset: 0, animation: 'ns-rotate 60s linear infinite' }}
        width="110" height="110" viewBox="0 0 110 110"
      >
        <circle cx="55" cy="55" r="52" fill="none" stroke="var(--ns-bg-1)" strokeWidth=".5" strokeDasharray="1 5" />
      </svg>

      <svg style={{ position: 'absolute', inset: 0 }} width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="49" fill="none" stroke="var(--ns-ring-track)" strokeWidth="6" />
        <circle cx="55" cy="55" r="49" fill="none" stroke="var(--ns-ring-cal)" strokeWidth="6"
          strokeDasharray={arc(49, calPct)} strokeLinecap="round"
          strokeDashoffset="77" opacity=".9" />

        <circle cx="55" cy="55" r="39" fill="none" stroke="var(--ns-ring-track)" strokeWidth="5" />
        <circle cx="55" cy="55" r="39" fill="none" stroke="var(--ns-ring-prot)" strokeWidth="5"
          strokeDasharray={arc(39, protPct)} strokeLinecap="round"
          strokeDashoffset="61" opacity=".8" />

        <circle cx="55" cy="55" r="30" fill="none" stroke="var(--ns-ring-track)" strokeWidth="4" />
        <circle cx="55" cy="55" r="30" fill="none" stroke="var(--ns-ring-water)" strokeWidth="4"
          strokeDasharray={arc(30, waterPct)} strokeLinecap="round"
          strokeDashoffset="47" opacity=".7" />
      </svg>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ns-t-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>
          {calories}
        </div>
        <div style={{ fontSize: 9, color: 'var(--ns-t-5)', letterSpacing: '-0.01em', marginTop: 2 }}>kcal</div>
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
    <div className="ns-macro-card ns-shimmer">
      <div className="ns-macro-header">
        <div className="ns-macro-dot" style={{ background: color }} />
        <span className="ns-macro-pct">{pct}%</span>
      </div>
      <div className="ns-macro-value">{value}{unit}</div>
      <div className="ns-macro-of">/{goal}{unit}</div>
      <div className="ns-macro-name">{label}</div>
      <Sparkline data={sparkData} color={color} />
      <div className="ns-bar-track" style={{ marginTop: 4 }}>
        <div className="ns-bar-fill" style={{ width: `${pct}%`, background: color }} />
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
  const firstName = profile?.name?.split(' ')[0] ?? 'Felipe';

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
    <div className="ns-page">
      <StatusBar />

      <div className="ns-px" style={{ paddingTop: 14 }}>
        {/* ── Greeting ── */}
        <div style={{ fontSize: 12, color: 'var(--ns-t-5)', letterSpacing: '-0.01em', marginBottom: 2 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{
          fontSize: 32, fontWeight: 700, color: 'var(--ns-t-primary)',
          letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 10,
        }}>
          {greeting()},<br />{firstName}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <div className="ns-chip">
            <div className="ns-chip-dot" style={{ background: 'var(--ns-t-3)' }} />
            <span className="ns-chip-text">Manutenção</span>
          </div>
          <div className="ns-chip">
            <span className="ns-chip-text">{doneCount} dias streak</span>
          </div>
        </div>

        {/* ── Hero Ring Card ── */}
        <div className="ns-card ns-shimmer" style={{ padding: 20, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <TripleRing
              calories={todayData.calories}
              goal={goalCal}
              protein={todayData.protein}
              water={todayData.water}
            />
            <div style={{ flex: 1 }}>
              <div className="ns-label" style={{ marginBottom: 4 }}>Restam hoje</div>
              <div style={{
                fontSize: 38, fontWeight: 800, color: 'var(--ns-t-primary)',
                letterSpacing: '-0.06em', lineHeight: 1,
              }}>
                {remaining.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ns-t-5)', letterSpacing: '-0.01em', marginTop: 3 }}>
                de {goalCal.toLocaleString('pt-BR')} kcal · {calPct}%
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
                {[
                  ['var(--ns-ring-cal)',   'Calorias', `${todayData.calories}/${goalCal}`],
                  ['var(--ns-ring-prot)',  'Proteína', `${todayData.protein}/150g`],
                  ['var(--ns-ring-water)', 'Água',     `${todayData.water}/2.625ml`],
                ].map(([c, l, v]) => (
                  <div key={l} className="ns-ring-legend-item">
                    <div className="ns-ring-legend-dot" style={{ background: c }} />
                    <span className="ns-ring-legend-label">{l}</span>
                    <span className="ns-ring-legend-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div style={{
            display: 'flex', gap: 4, marginTop: 16, paddingTop: 14,
            borderTop: '0.5px solid var(--ns-sep)', alignItems: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--ns-t-5)', letterSpacing: '-0.01em', marginRight: 4 }}>Streak</div>
            {streakDays.map((d, i) => (
              <div key={i} className={`ns-streak-day ${
                i === streakDays.length - 1 ? 'ns-streak-day--today' :
                i < doneCount ? 'ns-streak-day--done' : 'ns-streak-day--miss'
              }`}>{d}</div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10, color: 'var(--ns-t-3)', letterSpacing: '-0.01em', fontWeight: 600 }}>
              {doneCount}d
            </div>
          </div>
        </div>

        {/* ── Macro row ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <MacroCard label="Prot." value={todayData.protein} goal={150} color="var(--ns-macro-prot)" sparkData={[5,8,4,9,6,8,todayData.protein]} />
          <MacroCard label="Carb." value={todayData.carbs}   goal={260} color="var(--ns-macro-carb)" sparkData={[6,9,5,11,8,10,todayData.carbs]} />
          <MacroCard label="Gord." value={todayData.fat}     goal={82}  color="var(--ns-macro-fat)"  sparkData={[4,6,5,7,6,8,todayData.fat]} />
        </div>

        {/* ── Scan CTA ── */}
        <div className="ns-scan-cta ns-shimmer" style={{ marginBottom: 10 }}>
          <div className="ns-scan-icon">
            <div className="ns-scan-icon-pulse" />
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="2" stroke="var(--ns-t-primary)" strokeWidth="1.8"/>
              <rect x="14" y="1" width="7" height="7" rx="2" stroke="var(--ns-t-primary)" strokeWidth="1.8"/>
              <rect x="1" y="14" width="7" height="7" rx="2" stroke="var(--ns-t-primary)" strokeWidth="1.8"/>
              <rect x="14" y="14" width="3" height="3" rx=".6" fill="var(--ns-t-primary)"/>
              <rect x="18" y="14" width="3" height="3" rx=".6" fill="var(--ns-t-primary)"/>
              <rect x="14" y="18" width="3" height="3" rx=".6" fill="var(--ns-t-primary)"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="ns-scan-tag">IA Pronta · Groq</div>
            <div className="ns-scan-title">Escanear alimento</div>
          </div>
          <div className="ns-scan-arrow">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M3.5 2l4 3.5-4 3.5" stroke="var(--ns-t-primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ── 2x2 Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div className="ns-card-sm ns-shimmer" style={{ padding: 14 }}>
            <div className="ns-label" style={{ marginBottom: 6 }}>7 dias</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ns-t-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>
              {Math.round(weekData.reduce((a, b) => a + b, 0) / weekData.length).toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ns-t-5)', marginTop: 2, letterSpacing: '-0.01em' }}>kcal médio</div>
            <div style={{ marginTop: 8 }}>
              <MiniBarChart data={weekData} highlight="var(--ns-t-2)" height={28} />
            </div>
          </div>

          <div className="ns-card-sm ns-shimmer" style={{ padding: 14 }}>
            <div className="ns-label" style={{ marginBottom: 6 }}>Déficit</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ns-t-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>
              {remaining.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ns-t-5)', marginTop: 2, letterSpacing: '-0.01em' }}>kcal hoje</div>
            <div style={{ marginTop: 10 }}>
              <div className="ns-bar-track" style={{ marginBottom: 5 }}>
                <div className="ns-bar-fill" style={{ width: `${calPct}%`, background: 'var(--ns-t-1)' }} />
              </div>
              <div className="ns-bar-track">
                <div className="ns-bar-fill" style={{ width: `${(todayData.protein / 150) * 100}%`, background: 'var(--ns-t-3)' }} />
              </div>
            </div>
            <div style={{ fontSize: 8, color: 'var(--ns-t-6)', marginTop: 6, letterSpacing: '-0.01em' }}>Cal · Prot</div>
          </div>

          <div className="ns-card-sm ns-shimmer" style={{ gridColumn: '1/-1', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ns-t-primary)', letterSpacing: '-0.01em' }}>Linha do tempo</div>
              <div style={{ fontSize: 10, color: 'var(--ns-t-5)', letterSpacing: '-0.01em' }}>{mockMeals.length} refeições</div>
            </div>
            <Timeline meals={mockMeals} />
          </div>
        </div>

        {/* ── Water ── */}
        <div className="ns-card-sm ns-shimmer" style={{ padding: '14px 16px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ns-t-primary)', letterSpacing: '-0.01em' }}>Hidratação</div>
            <div style={{ fontSize: 11, color: 'var(--ns-t-5)', letterSpacing: '-0.01em' }}>
              {todayData.water}ml / 2.625ml
            </div>
          </div>
          <div className="ns-bar-track" style={{ marginBottom: 10 }}>
            <div className="ns-bar-fill" style={{
              width: `${(todayData.water / 2625) * 100}%`,
              background: 'var(--ns-macro-water)',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < Math.floor((todayData.water / 2625) * 5);
              return (
                <div key={i} style={{
                  flex: 1, height: 32, borderRadius: 10,
                  background: filled ? 'var(--ns-bg-3)' : 'var(--ns-bg-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  border: filled ? '0.5px solid var(--ns-t-5)' : '0.5px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                    <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
                      stroke={filled ? 'var(--ns-t-3)' : 'var(--ns-t-5)'} strokeWidth="1.2" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

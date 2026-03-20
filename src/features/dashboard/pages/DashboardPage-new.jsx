import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../../app/AppShell-new';
import { useAuth } from '../auth/hooks/useAuth';
import * as db from '../../../lib/db';

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
    <div style={{ flexShrink: 0, position: 'relative', width: 100, height: 100 }}>
      {/* Orbit ring */}
      <svg
        style={{ position: 'absolute', inset: 0, animation: 'ns-rotate 60s linear infinite' }}
        width="100" height="100" viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1c1c1e" strokeWidth=".5" strokeDasharray="1 5" />
      </svg>

      <svg style={{ position: 'absolute', inset: 0 }} width="100" height="100" viewBox="0 0 100 100">
        {/* Outer: calories */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="#2c2c2e" strokeWidth="6" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#ebebf0" strokeWidth="6"
          strokeDasharray={arc(44, calPct)} strokeLinecap="round"
          strokeDashoffset="69" opacity=".9" />

        {/* Mid: protein */}
        <circle cx="50" cy="50" r="35" fill="none" stroke="#2c2c2e" strokeWidth="5" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#aeaeb2" strokeWidth="5"
          strokeDasharray={arc(35, protPct)} strokeLinecap="round"
          strokeDashoffset="54" opacity=".8" />

        {/* Inner: water */}
        <circle cx="50" cy="50" r="27" fill="none" stroke="#2c2c2e" strokeWidth="4" />
        <circle cx="50" cy="50" r="27" fill="none" stroke="#636366" strokeWidth="4"
          strokeDasharray={arc(27, waterPct)} strokeLinecap="round"
          strokeDashoffset="42" opacity=".7" />
      </svg>

      {/* Center value */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
          {calories}
        </div>
        <div style={{ fontSize: 8, color: '#48484a', letterSpacing: '-0.01em', marginTop: 1 }}>kcal</div>
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────
function Sparkline({ data = [8,12,6,14,10,13,8], color = '#ebebf0' }) {
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
function MiniBarChart({ data = [], highlight = '#aeaeb2', height = 28 }) {
  const max = Math.max(...data, 1);
  const days = ['T', 'Q', 'Q', 'S', 'S', 'D', 'S'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {data.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: i === data.length - 1 ? highlight : '#2c2c2e',
            height: `${(v / max) * 100}%`,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        {days.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: 7, fontWeight: 600,
            color: i === days.length - 1 ? highlight : '#3a3a3c',
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
              fontSize: 7, color: '#636366', fontWeight: 600,
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState(null);
  const [scans, setScans] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [profileData, goalsData, scansData, hydrationData] = await Promise.all([
        db.getProfile(user.id),
        db.getDailyGoals(user.id),
        db.listScanHistory(user.id, 50),
        db.getHydrationToday(user.id),
      ]);
      setProfile(profileData);
      setGoals(goalsData);
      setScans(scansData || []);
      setWaterGlasses(hydrationData?.glasses || 0);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Usuário';
  const goalCal = goals?.calories ?? 2732;

  const today = new Date().toLocaleDateString("pt-BR");
  const todayScans = scans.filter(s => new Date(s.scanned_at).toLocaleDateString("pt-BR") === today);
  const todayData = {
    calories: todayScans.reduce((sum, s) => sum + (s.calories || 0), 0),
    protein: todayScans.reduce((sum, s) => sum + (s.protein || 0), 0),
    carbs: todayScans.reduce((sum, s) => sum + (s.carbs || 0), 0),
    fat: todayScans.reduce((sum, s) => sum + (s.fat || 0), 0),
    water: waterGlasses * 250, // 250ml per glass
  };

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
    { emoji: '🍚', calories: Math.floor(todayData.calories * 0.4), timePercent: 33 },
    { emoji: '🍗', calories: Math.floor(todayData.calories * 0.6), timePercent: 80 },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#000'
      }}>
        <div style={{
          width: 32, height: 32, border: '2px solid #2c2c2e',
          borderTop: '2px solid #ebebf0', borderRadius: '50%',
          animation: 'ns-rotate 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div className="ns-page">
      <StatusBar />

      <div className="ns-px" style={{ paddingTop: 14 }}>
        {/* ── Greeting ── */}
        <div style={{ fontSize: 12, color: '#48484a', letterSpacing: '-0.01em', marginBottom: 1 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{
          fontSize: 34, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8,
        }}>
          {greeting()},<br />{firstName}
        </div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          <div className="ns-chip">
            <div className="ns-chip-dot" style={{ background: '#8e8e93' }} />
            <span className="ns-chip-text">Manutenção</span>
          </div>
          <div className="ns-chip">
            <span className="ns-chip-text">{doneCount} dias streak</span>
          </div>
        </div>

        {/* ── Hero Ring Card ── */}
        <div className="ns-card ns-shimmer" style={{ padding: 18, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <TripleRing
              calories={todayData.calories}
              goal={goalCal}
              protein={todayData.protein}
              water={todayData.water}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#48484a', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>
                Restam hoje
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1 }}>
                {(goalCal - todayData.calories).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 12, color: '#48484a', letterSpacing: '-0.01em', marginTop: 1 }}>
                de {goalCal.toLocaleString('pt-BR')} kcal · {Math.round((todayData.calories / goalCal) * 100)}%
              </div>

              {/* Ring legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                {[
                  ['#ebebf0', 'Calorias', `${todayData.calories}/${goalCal}`],
                  ['#aeaeb2', 'Proteína', `${todayData.protein}/${goals?.protein || 150}g`],
                  ['#636366', 'Água',     `${todayData.water}/${goals?.water || 2625}ml`],
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
            display: 'flex', gap: 4, marginTop: 14, paddingTop: 12,
            borderTop: '.5px solid #2c2c2e', alignItems: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#48484a', letterSpacing: '-0.01em', marginRight: 4 }}>Streak</div>
            {streakDays.map((d, i) => (
              <div key={i} className={`ns-streak-day ${
                i === streakDays.length - 1 ? 'ns-streak-day--today' :
                i < doneCount ? 'ns-streak-day--done' : 'ns-streak-day--miss'
              }`}>{d}</div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10, color: '#8e8e93', letterSpacing: '-0.01em', fontWeight: 600 }}>
              {doneCount}d 🔥
            </div>
          </div>
        </div>

        {/* ── Macro row ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <MacroCard label="Prot." value={todayData.protein} goal={goals?.protein || 150} color="#ebebf0" sparkData={[5,8,4,9,6,8,todayData.protein]} />
          <MacroCard label="Carb." value={todayData.carbs}   goal={goals?.carbs || 260} color="#aeaeb2" sparkData={[6,9,5,11,8,10,todayData.carbs]} />
          <MacroCard label="Gord." value={todayData.fat}     goal={goals?.fat || 82}  color="#8e8e93" sparkData={[4,6,5,7,6,8,todayData.fat]} />
        </div>

        {/* ── Scan CTA ── */}
        <div className="ns-scan-cta ns-shimmer" style={{ marginBottom: 10 }} onClick={() => navigate('/scan')}>
          <div className="ns-scan-icon">
            <div className="ns-scan-icon-pulse" />
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="2" stroke="#fff" strokeWidth="1.8"/>
              <rect x="14" y="1" width="7" height="7" rx="2" stroke="#fff" strokeWidth="1.8"/>
              <rect x="1" y="14" width="7" height="7" rx="2" stroke="#fff" strokeWidth="1.8"/>
              <rect x="14" y="14" width="3" height="3" rx=".6" fill="#fff"/>
              <rect x="18" y="14" width="3" height="3" rx=".6" fill="#fff"/>
              <rect x="14" y="18" width="3" height="3" rx=".6" fill="#fff"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="ns-scan-tag">IA Pronta · Claude Opus</div>
            <div className="ns-scan-title">Escanear alimento</div>
          </div>
          <div className="ns-scan-arrow">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M3.5 2l4 3.5-4 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ── Coach IA CTA ── */}
        <div className="ns-scan-cta ns-shimmer" style={{ marginBottom: 10 }} onClick={() => navigate('/coach')}>
          <div className="ns-scan-icon">
            <div className="ns-scan-icon-pulse" />
            <div style={{ fontSize: 24 }}>🧠</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="ns-scan-tag">Coach IA · Disponível</div>
            <div className="ns-scan-title">NutriCoach</div>
          </div>
          <div className="ns-scan-arrow">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M3.5 2l4 3.5-4 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ── 2×2 Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {/* Week chart */}
          <div className="ns-card-sm ns-shimmer" style={{ padding: 13 }}>
            <div className="ns-label" style={{ marginBottom: 5 }}>7 dias</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
              {Math.round(weekData.reduce((a, b) => a + b, 0) / weekData.length).toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 10, color: '#48484a', marginTop: 1, letterSpacing: '-0.01em' }}>kcal médio</div>
            <MiniBarChart data={weekData} highlight="#aeaeb2" height={28} />
          </div>

          {/* Déficit */}
          <div className="ns-card-sm ns-shimmer" style={{ padding: 13 }}>
            <div className="ns-label" style={{ marginBottom: 5 }}>Déficit</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
              {(goalCal - todayData.calories).toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 10, color: '#48484a', marginTop: 1, letterSpacing: '-0.01em' }}>kcal hoje</div>
            <div style={{ marginTop: 10 }}>
              <div className="ns-bar-track" style={{ marginBottom: 5 }}>
                <div className="ns-bar-fill" style={{ width: `${(todayData.calories / goalCal) * 100}%`, background: '#ebebf0' }} />
              </div>
              <div className="ns-bar-track">
                <div className="ns-bar-fill" style={{ width: `${(todayData.protein / (goals?.protein || 150)) * 100}%`, background: '#8e8e93' }} />
              </div>
            </div>
            <div style={{ fontSize: 8, color: '#3a3a3c', marginTop: 6, letterSpacing: '-0.01em' }}>Cal · Macro</div>
          </div>

          {/* Timeline */}
          <div className="ns-card-sm ns-shimmer" style={{ gridColumn: '1/-1', padding: '12px 14px', borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>Linha do tempo</div>
              <div style={{ fontSize: 10, color: '#48484a', letterSpacing: '-0.01em' }}>{mockMeals.length} refeições</div>
            </div>
            <Timeline meals={mockMeals} />
          </div>
        </div>

        {/* ── Water ── */}
        <div className="ns-card-sm ns-shimmer" style={{ padding: '12px 14px', marginBottom: 4, borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>Hidratação</div>
            <div style={{ fontSize: 11, color: '#48484a', letterSpacing: '-0.01em' }}>
              {todayData.water}ml / {goals?.water || 2625}ml
            </div>
          </div>
          <div className="ns-bar-track" style={{ marginBottom: 8 }}>
            <div className="ns-bar-fill" style={{
              width: `${(todayData.water / (goals?.water || 2625)) * 100}%`,
              background: '#8e8e93',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < Math.floor((todayData.water / (goals?.water || 2625)) * 5);
              return (
                <div key={i} style={{
                  flex: 1, height: 28, borderRadius: 9,
                  background: filled ? '#3a3a3c' : '#2c2c2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: filled ? '1px solid #48484a' : 'none',
                }}
                onClick={async () => {
                  const newGlasses = i + 1;
                  setWaterGlasses(newGlasses);
                  try {
                    await db.saveHydration(user.id, newGlasses);
                  } catch (err) {
                    console.error("Erro ao salvar hidratação:", err);
                  }
                }}
                >
                  <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                    <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
                      stroke={filled ? '#8e8e93' : '#48484a'} strokeWidth="1.2" />
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
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  listScanHistory,
  getDailyGoals,
  getHydrationToday,
  saveHydration,
  listWeightLogs,
} from '../../../lib/db';

// ── Progress Ring (calorias) ───────────────────────────────
function CalorieRing({ calories = 0, goal = 2000 }) {
  const pct = Math.min(calories / goal, 1);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const gap  = circ * (1 - pct) + circ;

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg style={{ position: 'absolute', inset: 0 }} width="130" height="130" viewBox="0 0 130 130" role="img" aria-label={`${calories} de ${goal} kcal consumidos`}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--ns-ring-track)" strokeWidth="8" />
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--ns-ring-cal)" strokeWidth="8"
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
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {calories}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ns-text-muted)', marginTop: 2 }}>kcal</div>
      </div>
    </div>
  );
}

// ── Macro Card ────────────────────────────────────────────
const MACRO_COLORS = {
  'Proteína':    'var(--ns-macro-protein)',
  'Carboidrato': 'var(--ns-macro-carb)',
  'Gordura':     'var(--ns-macro-fat)',
};

function MacroCard({ label, value, goal, unit = 'g' }) {
  const pct   = goal > 0 ? Math.min(Math.round((value / goal) * 100), 100) : 0;
  const color = MACRO_COLORS[label] || 'var(--ns-accent)';

  return (
    <div style={{
      background: 'var(--ns-bg-card)',
      border: '0.5px solid var(--ns-border)',
      borderRadius: 14,
      padding: '14px 12px',
      flex: 1,
      minWidth: 0,
      boxShadow: 'var(--ns-shadow-sm)',
    }}>
      <div style={{
        fontSize: 10, color: 'var(--ns-text-muted)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'var(--ns-text-primary)',
        letterSpacing: '-0.03em', marginTop: 4, lineHeight: 1,
      }}>
        {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ns-text-muted)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ns-text-muted)', marginTop: 2 }}>de {goal}{unit}</div>
      <div style={{ height: 8, background: 'var(--ns-ring-track)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: color, borderRadius: 4,
          width: `${pct}%`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────
function MiniBarChart({ data = [], todayIndex = 6, height = 28 }) {
  const max = Math.max(...data, 1);
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {data.map((v, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: i === todayIndex ? 'var(--ns-accent)' : 'var(--ns-ring-track)',
            height: `${(v / max) * 100}%`,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        {days.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', fontSize: 8, fontWeight: 600,
            color: i === todayIndex ? 'var(--ns-text-secondary)' : 'var(--ns-text-disabled)',
          }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────
function SkeletonBlock({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--ns-ring-track)',
      animation: 'ns-pulse 1.4s ease infinite',
      ...style,
    }} />
  );
}

// ── Dashboard Page ────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuário';

  const [loading, setLoading]       = useState(true);
  const [todayData, setTodayData]   = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [weekData, setWeekData]     = useState([0, 0, 0, 0, 0, 0, 0]);
  const [streakDays, setStreakDays] = useState([false, false, false, false, false, false, false]);
  const [streakCount, setStreakCount] = useState(0);
  const [goals, setGoals]           = useState({ calories: 2000, protein: 150, carbs: 250, fat: 70, water: 2625 });
  const [waterMl, setWaterMl]       = useState(0);
  const [savingWater, setSavingWater] = useState(false);
  const [errorMsg, setErrorMsg]     = useState(null);

  // Índice do dia de hoje na semana (0=Seg ... 6=Dom)
  const todayWeekIndex = (() => {
    const d = new Date().getDay(); // 0=Dom
    return d === 0 ? 6 : d - 1;
  })();

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const [allScans, goalsData, hydration] = await Promise.all([
        listScanHistory(user.id, 200),
        getDailyGoals(user.id),
        getHydrationToday(user.id),
      ]);

      // Metas do dia
      if (goalsData) {
        setGoals({
          calories: goalsData.calories ?? 2000,
          protein:  goalsData.protein  ?? 150,
          carbs:    goalsData.carbs    ?? 250,
          fat:      goalsData.fat      ?? 70,
          water:    goalsData.water    ?? 2625,
        });
      }

      // Hidratação
      if (hydration) {
        setWaterMl((hydration.glasses ?? 0) * 250);
      }

      // Bug 4 fix: usar timezone local (UTC-3) em vez de UTC para comparar datas
      const toLocalDateStr = (date) => date.toLocaleDateString('fr-CA'); // YYYY-MM-DD local
      const todayStr = toLocalDateStr(new Date());

      // Scans de hoje → totais de macros (usa timezone local)
      const todayScans = allScans.filter(s => {
        if (!s.scanned_at) return false;
        const d = toLocalDateStr(new Date(s.scanned_at));
        return d === todayStr;
      });

      const todayTotals = todayScans.reduce(
        (acc, s) => ({
          calories: acc.calories + (s.calories ?? 0),
          protein:  acc.protein  + (s.protein  ?? 0),
          carbs:    acc.carbs    + (s.carbs    ?? 0),
          fat:      acc.fat      + (s.fat      ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setTodayData({
        calories: Math.round(todayTotals.calories),
        protein:  Math.round(todayTotals.protein),
        carbs:    Math.round(todayTotals.carbs),
        fat:      Math.round(todayTotals.fat),
      });

      // Semana: últimos 7 dias (Seg-Dom da semana atual)
      const weekCalories = [0, 0, 0, 0, 0, 0, 0];
      const weekWithScans = [false, false, false, false, false, false, false];

      const now = new Date();
      // Início da semana (segunda-feira)
      const startOfWeek = new Date(now);
      const dow = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Seg
      startOfWeek.setDate(now.getDate() - dow);
      startOfWeek.setHours(0, 0, 0, 0);

      allScans.forEach(s => {
        if (!s.scanned_at) return;
        // Bug 4 fix: usar meia-noite local do dia do scan para comparar com startOfWeek
        const scanDate = new Date(s.scanned_at);
        const scanLocalMidnight = new Date(
          scanDate.getFullYear(), scanDate.getMonth(), scanDate.getDate()
        );
        const diffDays = Math.floor((scanLocalMidnight - startOfWeek) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 6) {
          weekCalories[diffDays] += s.calories ?? 0;
          weekWithScans[diffDays] = true;
        }
      });

      setWeekData(weekCalories.map(v => Math.round(v)));
      setStreakDays(weekWithScans);

      // Bug 3 fix: streak conta dias consecutivos a partir do ultimo dia com registro
      // (não obriga que "hoje" tenha dados — conta até o dia mais recente com dado)
      let streak = 0;
      const lastActiveDay = weekWithScans.lastIndexOf(true);
      if (lastActiveDay >= 0) {
        for (let i = lastActiveDay; i >= 0; i--) {
          if (weekWithScans[i]) streak++;
          else break;
        }
      }
      setStreakCount(streak);

    } catch (err) {
      console.error('[Dashboard] Erro ao carregar dados:', err);
      setErrorMsg('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, todayWeekIndex]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddWater = async () => {
    if (savingWater || !user?.id) return;
    const currentGlasses = Math.round(waterMl / 250);
    const maxGlasses = Math.round(goals.water / 250);
    if (currentGlasses >= maxGlasses) return;

    const newGlasses = currentGlasses + 1;
    setWaterMl(newGlasses * 250);
    setSavingWater(true);
    try {
      await saveHydration(user.id, newGlasses);
    } catch (err) {
      // Reverter otimismo
      setWaterMl(currentGlasses * 250);
      console.error('[Dashboard] Erro ao salvar hidratação:', err);
    } finally {
      setSavingWater(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const goalCal   = goals.calories;
  const remaining = Math.max(goalCal - todayData.calories, 0);
  const calPct    = Math.round((todayData.calories / goalCal) * 100);
  const waterGoal = goals.water;
  const waterPct  = Math.round((waterMl / waterGoal) * 100);
  const waterFilledCount = Math.floor((waterMl / waterGoal) * 5);

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const hasAnyData = todayData.calories > 0;

  return (
    <div style={{ background: 'var(--ns-bg-primary)', minHeight: '100dvh', paddingBottom: 100 }}>
      <StatusBar />

      {/* ── Header premium ── */}
      <header style={{ padding: '20px 20px 16px', background: 'var(--ns-bg-primary)' }} className="animate-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 13, color: 'var(--ns-text-muted)',
              margin: '0 0 4px', fontWeight: 500,
              letterSpacing: '0.01em',
              textTransform: 'capitalize',
            }}>
              {todayFormatted}
            </p>
            <h1 style={{
              fontSize: 28, fontWeight: 700,
              color: 'var(--ns-text-primary)',
              letterSpacing: '-0.03em',
              margin: 0, lineHeight: 1.1,
            }}>
              {greeting()}, {firstName}
            </h1>
            <p style={{
              fontSize: 14, color: 'var(--ns-text-muted)',
              margin: '6px 0 0', lineHeight: 1.4,
            }}>
              {loading
                ? 'Carregando dados...'
                : hasAnyData
                  ? `${todayData.calories.toLocaleString('pt-BR')} kcal registradas hoje`
                  : 'Registre sua primeira refeição'}
            </p>
          </div>
        </div>
      </header>

      <div style={{ padding: '8px 20px 0' }}>

        {/* ── Erro ── */}
        {errorMsg && (
          <div style={{
            background: 'var(--ns-danger-bg)',
            border: '0.5px solid var(--ns-danger)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--ns-danger)',
            fontWeight: 500,
          }}>
            {errorMsg}
          </div>
        )}

        {/* ── Hero Card de Calorias ── */}
        <div style={{
          background: 'var(--ns-bg-card)',
          border: '0.5px solid var(--ns-border)',
          borderRadius: 20,
          padding: 22, marginBottom: 12,
          boxShadow: 'var(--ns-shadow-sm)',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <SkeletonBlock width={130} height={130} radius={65} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SkeletonBlock width="60%" height={14} />
                <SkeletonBlock width="80%" height={36} />
                <SkeletonBlock width="50%" height={12} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <CalorieRing calories={todayData.calories} goal={goalCal} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--ns-text-muted)', marginBottom: 4, fontWeight: 500 }}>
                    Restam hoje
                  </div>
                  <div style={{
                    fontSize: 42, fontWeight: 700, color: 'var(--ns-text-primary)',
                    letterSpacing: '-0.04em', lineHeight: 1,
                  }}>
                    {remaining.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ns-text-muted)', marginTop: 4 }}>
                    de {goalCal.toLocaleString('pt-BR')} kcal
                  </div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'var(--ns-accent-bg)', borderRadius: 20,
                    padding: '4px 10px', marginTop: 10,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ns-accent)', marginRight: 6 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ns-accent)' }}>{calPct}% consumido</span>
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div style={{ marginTop: 18 }}>
                <div style={{ height: 4, background: 'var(--ns-ring-track)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'var(--ns-ring-cal)', borderRadius: 4,
                    width: `${Math.min(calPct, 100)}%`,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>

              {/* Streak — dias da semana */}
              <div style={{
                display: 'flex', gap: 5, marginTop: 16, paddingTop: 14,
                borderTop: '0.5px solid var(--ns-sep)', alignItems: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--ns-text-muted)', marginRight: 4, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Sequência
                </div>
                {DAY_LABELS.map((d, i) => {
                  const isToday = i === todayWeekIndex;
                  const done = streakDays[i];
                  return (
                    <div
                      key={i}
                      style={{
                        width: 30, height: 26, borderRadius: 8, fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isToday
                          ? 'var(--ns-accent)'
                          : done
                          ? 'var(--ns-accent-bg)'
                          : 'var(--ns-bg-elevated)',
                        color: isToday
                          ? '#FFFFFF'
                          : done
                          ? 'var(--ns-accent)'
                          : 'var(--ns-text-disabled)',
                        border: isToday
                          ? 'none'
                          : done
                          ? '0.5px solid rgba(45,143,94,0.25)'
                          : '0.5px solid var(--ns-border)',
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 12, color: 'var(--ns-accent)', fontWeight: 700 }}>
                  {streakCount}d
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Empty state ── */}
        {!loading && !hasAnyData && !errorMsg && (
          <div style={{
            background: 'var(--ns-bg-card)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 16,
            padding: '24px 20px',
            marginBottom: 12,
            textAlign: 'center',
            boxShadow: 'var(--ns-shadow-sm)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--ns-accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 9V5h4" stroke="var(--ns-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 9V5h-4" stroke="var(--ns-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15v4h4" stroke="var(--ns-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 15v4h-4" stroke="var(--ns-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="var(--ns-accent)" strokeWidth="1.8" />
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Nenhum alimento registrado
            </div>
            <div style={{ fontSize: 13, color: 'var(--ns-text-muted)', lineHeight: 1.5 }}>
              Faça seu primeiro scan para começar a acompanhar sua nutrição de hoje.
            </div>
          </div>
        )}

        {/* ── Seção: Macros ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 17, fontWeight: 600, color: 'var(--ns-text-primary)',
            letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            Macros de hoje
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <SkeletonBlock height={88} style={{ flex: 1, borderRadius: 14 }} />
              <SkeletonBlock height={88} style={{ flex: 1, borderRadius: 14 }} />
              <SkeletonBlock height={88} style={{ flex: 1, borderRadius: 14 }} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <MacroCard label="Proteína"    value={todayData.protein} goal={goals.protein} />
              <MacroCard label="Carboidrato" value={todayData.carbs}   goal={goals.carbs}   />
              <MacroCard label="Gordura"     value={todayData.fat}     goal={goals.fat}     />
            </div>
          )}
        </div>

        {/* ── Scan CTA ── */}
        <button
          onClick={() => navigate('/scan')}
          style={{
            marginBottom: 12,
            background: 'var(--ns-bg-card)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 16, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            WebkitTapHighlightColor: 'transparent', cursor: 'pointer',
            width: '100%', textAlign: 'left',
            boxShadow: 'var(--ns-shadow-sm)',
          }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'var(--ns-accent)',
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
            <div style={{ fontSize: 11, color: 'var(--ns-accent)', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>
              IA Pronta
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
              Escanear alimento
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'var(--ns-bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5l4 3.5-4 3.5" stroke="var(--ns-text-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {/* ── Seção: Esta semana ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 17, fontWeight: 600, color: 'var(--ns-text-primary)',
            letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            Esta semana
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <SkeletonBlock height={120} style={{ borderRadius: 16 }} />
              <SkeletonBlock height={120} style={{ borderRadius: 16 }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{
                padding: 16,
                background: 'var(--ns-bg-card)',
                border: '0.5px solid var(--ns-border)',
                borderRadius: 16,
                boxShadow: 'var(--ns-shadow-sm)',
              }}>
                <div style={{ fontSize: 12, color: 'var(--ns-text-muted)', fontWeight: 500, marginBottom: 8 }}>Média 7 dias</div>
                <div style={{
                  fontSize: 26, fontWeight: 700, color: 'var(--ns-text-primary)',
                  letterSpacing: '-0.04em', lineHeight: 1,
                }}>
                  {Math.round(weekData.reduce((a, b) => a + b, 0) / Math.max(weekData.filter(v => v > 0).length, 1)).toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ns-text-muted)', marginTop: 3 }}>
                  kcal/dia ({weekData.filter(v => v > 0).length} de 7 dias)
                </div>
                <div style={{ marginTop: 10 }}>
                  <MiniBarChart data={weekData} todayIndex={todayWeekIndex} height={32} />
                </div>
              </div>

              <div style={{
                padding: 16,
                background: 'var(--ns-bg-card)',
                border: '0.5px solid var(--ns-border)',
                borderRadius: 16,
                boxShadow: 'var(--ns-shadow-sm)',
              }}>
                <div style={{ fontSize: 12, color: 'var(--ns-text-muted)', fontWeight: 500, marginBottom: 8 }}>Restante</div>
                <div style={{
                  fontSize: 26, fontWeight: 700, color: 'var(--ns-text-primary)',
                  letterSpacing: '-0.04em', lineHeight: 1,
                }}>
                  {remaining.toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ns-text-muted)', marginTop: 3 }}>kcal restantes</div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--ns-ring-track)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      width: `${Math.min(calPct, 100)}%`, height: '100%', borderRadius: 4, background: 'var(--ns-ring-cal)',
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--ns-ring-track)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(Math.round((todayData.protein / goals.protein) * 100), 100)}%`,
                      height: '100%', borderRadius: 4, background: 'var(--ns-macro-protein)',
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ns-text-muted)', marginTop: 5 }}>Cal · Prot</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Seção: Hidratação ── */}
        <div style={{ marginBottom: 4 }}>
          <div style={{
            fontSize: 17, fontWeight: 600, color: 'var(--ns-text-primary)',
            letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            Hidratação
          </div>
          <div style={{
            padding: '16px 18px',
            background: 'var(--ns-bg-card)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 16, marginBottom: 20,
            boxShadow: 'var(--ns-shadow-sm)',
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SkeletonBlock height={20} width="50%" />
                <SkeletonBlock height={4} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBlock key={i} height={38} style={{ flex: 1, borderRadius: 12 }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {waterMl}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ns-text-muted)' }}>ml</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ns-text-muted)' }}>meta {waterGoal.toLocaleString('pt-BR')}ml</div>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'var(--ns-ring-track)', overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{
                    width: `${Math.min(waterPct, 100)}%`, height: '100%', borderRadius: 4,
                    background: 'var(--ns-blue)',
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < waterFilledCount;
                    const isNextToFill = i === waterFilledCount;
                    return (
                      <div
                        key={i}
                        onClick={!savingWater && isNextToFill ? handleAddWater : undefined}
                        style={{
                          flex: 1, height: 42, borderRadius: 12,
                          background: filled ? 'var(--ns-blue)' : 'var(--ns-bg-elevated)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: (savingWater || !isNextToFill) ? 'default' : 'pointer',
                          border: filled ? 'none' : isNextToFill ? '1.5px dashed var(--ns-blue)' : '0.5px solid var(--ns-border)',
                          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                          WebkitTapHighlightColor: 'transparent',
                          opacity: savingWater ? 0.7 : 1,
                          transform: isNextToFill && !savingWater ? 'scale(1)' : 'scale(1)',
                        }}
                      >
                        <svg width="14" height="18" viewBox="0 0 10 13" fill="none">
                          <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
                            fill={filled ? '#FFFFFF' : 'none'}
                            stroke={filled ? '#FFFFFF' : isNextToFill ? 'var(--ns-blue)' : 'var(--ns-text-disabled)'}
                            strokeWidth={filled ? '0' : '1.2'} />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

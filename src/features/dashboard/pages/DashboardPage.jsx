import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../../../app/AppShell';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  listScanHistory,
  getDailyGoals,
  getHydrationToday,
  saveHydration,
  listWeightLogs,
  saveScanHistory,
} from '../../../lib/db';

// ── Praxi: estado reativo baseado nos dados do dia ────────────────────────────
function getPraxiState({ caloriesPercent, proteinPercent, waterPercent, streak, hour }) {
  if (caloriesPercent === 0 && hour < 12) return 'waving';
  if (caloriesPercent === 0 && hour >= 12) return 'sleeping';
  if (proteinPercent >= 80) return 'proud';
  if (waterPercent < 30) return 'worried';
  if (caloriesPercent >= 95) return 'celebrating';
  return 'happy';
}

const PRAXI_STATE_LABELS = {
  waving:      'Bom dia! Pronto pra começar',
  sleeping:    'Ei, ainda não registrou nada?',
  proud:       'Proteína no ponto! Ótimo dia',
  worried:     'Beba água! Você está desidratado',
  celebrating: 'Meta de calorias quase atingida!',
  happy:       'Praxi pronto',
};

// ── Quick Actions dinâmicas do Coach ─────────────────────────────────────────
function getQuickActions({ caloriesPercent, hour, hasLogs }) {
  if (!hasLogs) return [
    { label: 'O que comer agora?', icon: '🍽️' },
    { label: 'Registrar refeição', icon: '📝' },
    { label: 'Meta de hoje', icon: '🎯' },
  ];
  if (hour >= 20) return [
    { label: 'Fechar o dia', icon: '🌙' },
    { label: 'Plano pra amanhã', icon: '📋' },
    { label: 'Resumo da semana', icon: '📊' },
  ];
  if (caloriesPercent >= 85) return [
    { label: 'Posso comer sobremesa?', icon: '🍰' },
    { label: 'Quanto falta?', icon: '📏' },
    { label: 'Resumo', icon: '✅' },
  ];
  return [
    { label: 'Quanto falta?', icon: '📏' },
    { label: 'Sugerir lanche', icon: '🍎' },
    { label: 'Dica do Praxi', icon: '💡' },
  ];
}

// ── Chrono Score ──────────────────────────────────────────────────────────────
function calcChronoScore(todayScansWithTime) {
  if (!todayScansWithTime || todayScansWithTime.length < 2) return null;

  const hours = todayScansWithTime
    .map(s => s.scanned_at ? new Date(s.scanned_at).getHours() + new Date(s.scanned_at).getMinutes() / 60 : null)
    .filter(h => h !== null);

  if (hours.length < 2) return null;

  const minHour = Math.min(...hours);
  const maxHour = Math.max(...hours);
  const windowHours = maxHour - minHour;

  // 40%: refeições antes das 15h
  const hasMorningMeals = hours.some(h => h < 15);
  const morningScore = hasMorningMeals ? 40 : 0;

  // 30%: ausência de refeições após as 22h
  const hasLateEating = hours.some(h => h >= 22);
  const lateScore = hasLateEating ? 0 : 30;

  // 30%: janela alimentar <= 12h
  const windowScore = windowHours <= 12 ? 30 : Math.max(0, 30 - (windowHours - 12) * 5);

  return Math.round(morningScore + lateScore + windowScore);
}

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
        <div className="mono-num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
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
      <div className="mono-num" style={{
        fontSize: 22, fontWeight: 700, color: 'var(--ns-text-primary)',
        letterSpacing: '-0.03em', marginTop: 4, lineHeight: 1,
      }}>
        {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ns-text-muted)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ns-text-muted)', marginTop: 2 }}>de {goal}{unit}</div>
      <div style={{ height: 7, background: 'var(--ns-ring-track)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
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

  const shouldReduce = useReducedMotion();
  const [loading, setLoading]       = useState(true);
  const [todayData, setTodayData]   = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [weekData, setWeekData]     = useState([0, 0, 0, 0, 0, 0, 0]);
  const [streakDays, setStreakDays] = useState([false, false, false, false, false, false, false]);
  const [streakCount, setStreakCount] = useState(0);
  const [goals, setGoals]           = useState({ calories: 2000, protein: 150, carbs: 250, fat: 70, water: 2625 });
  const [waterMl, setWaterMl]       = useState(0);
  const [savingWater, setSavingWater] = useState(false);
  const [errorMsg, setErrorMsg]     = useState(null);
  const [todayScans, setTodayScans] = useState([]);
  const [frequentFoods, setFrequentFoods] = useState([]);
  const [quickRegisterLoading, setQuickRegisterLoading] = useState(null);

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

      // Guardar scans de hoje com horário (para Chrono Score)
      setTodayScans(todayScans);

      // Top 5 alimentos frequentes dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentScans = allScans.filter(s => s.scanned_at && new Date(s.scanned_at) >= thirtyDaysAgo);
      const foodCount = {};
      recentScans.forEach(s => {
        if (!s.food_name) return;
        const key = s.food_name.trim().toLowerCase();
        if (!foodCount[key]) {
          foodCount[key] = { name: s.food_name, count: 0, calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat };
        }
        foodCount[key].count += 1;
      });
      const top5 = Object.values(foodCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setFrequentFoods(top5);

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

  // ── Praxi State ───────────────────────────────────────────────────────────
  const currentHour = new Date().getHours();
  const proteinPct  = goals.protein > 0 ? Math.round((todayData.protein / goals.protein) * 100) : 0;
  const praxiState  = getPraxiState({
    caloriesPercent: calPct,
    proteinPercent:  proteinPct,
    waterPercent:    waterPct,
    streak:          streakCount,
    hour:            currentHour,
  });

  // ── Quick Actions ─────────────────────────────────────────────────────────
  const quickActions = getQuickActions({
    caloriesPercent: calPct,
    hour:            currentHour,
    hasLogs:         hasAnyData,
  });

  // ── Chrono Score ──────────────────────────────────────────────────────────
  const chronoScore = calcChronoScore(todayScans);

  // ── Quick Register ────────────────────────────────────────────────────────
  const handleQuickRegister = async (food) => {
    if (!user?.id || quickRegisterLoading) return;
    setQuickRegisterLoading(food.name);
    try {
      await saveScanHistory({
        userId: user.id,
        analysis: {
          food_name: food.name,
          calories:  food.calories,
          protein:   food.protein,
          carbs:     food.carbs,
          fat:       food.fat,
        },
        scannedAt: new Date().toISOString(),
      });
      await loadData();
    } catch (err) {
      console.error('[Dashboard] Erro ao registrar alimento rápido:', err);
    } finally {
      setQuickRegisterLoading(null);
    }
  };

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

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: 'var(--ns-accent-bg)', borderRadius: 20,
                      padding: '4px 10px',
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ns-accent)', marginRight: 6 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ns-accent)' }}>{calPct}% consumido</span>
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(26,127,86,0.08)',
                      fontSize: 12, fontWeight: 600, color: 'var(--ns-accent)',
                    }}>
                      ⏰ Chrono {chronoScore ?? '--'}
                    </div>
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

        {/* ── Refeições frequentes ── */}
        {!loading && frequentFoods.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ns-text-muted)',
              letterSpacing: '0.02em', textTransform: 'uppercase',
              marginBottom: 8, paddingLeft: 2,
            }}>
              Registrar novamente
            </div>
            <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {frequentFoods.map(food => (
                <button
                  key={food.name}
                  onClick={() => handleQuickRegister(food)}
                  disabled={!!quickRegisterLoading}
                  style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 20,
                    background: quickRegisterLoading === food.name ? 'var(--ns-accent-bg)' : 'var(--ns-bg-card)',
                    border: quickRegisterLoading === food.name
                      ? '1px solid var(--ns-accent)'
                      : '1px solid var(--ns-border)',
                    fontSize: 13, fontWeight: 500, color: 'var(--ns-text-primary)',
                    cursor: quickRegisterLoading ? 'default' : 'pointer',
                    whiteSpace: 'nowrap', opacity: quickRegisterLoading && quickRegisterLoading !== food.name ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {quickRegisterLoading === food.name ? '...' : food.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
        <motion.button
          onClick={() => navigate('/scan')}
          whileTap={{ scale: shouldReduce ? 1 : 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
              {loading ? 'Praxi pronto' : PRAXI_STATE_LABELS[praxiState]}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
              Escanear refeição
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
        </motion.button>

        {/* ── Quick Actions do Coach ── */}
        {!loading && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ns-text-muted)',
              letterSpacing: '0.02em', textTransform: 'uppercase',
              marginBottom: 8, paddingLeft: 2,
            }}>
              Pergunte ao Praxi
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate('/coach', { state: { initialMessage: action.label } })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 14px', borderRadius: 20,
                    background: 'var(--ns-bg-card)',
                    border: '0.5px solid var(--ns-border)',
                    fontSize: 13, fontWeight: 500, color: 'var(--ns-text-primary)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: 'var(--ns-shadow-sm)',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                <div className="mono-num" style={{
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
                <div className="mono-num" style={{
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
                    <span className="mono-num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
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
                      <motion.div
                        key={i}
                        onClick={!savingWater && isNextToFill ? handleAddWater : undefined}
                        whileTap={{ scale: shouldReduce ? 1 : (isNextToFill && !savingWater ? 1.2 : 1) }}
                        animate={{ backgroundColor: filled ? 'var(--ns-blue)' : 'var(--ns-bg-elevated)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                          flex: 1, height: 42, borderRadius: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: (savingWater || !isNextToFill) ? 'default' : 'pointer',
                          border: filled ? 'none' : isNextToFill ? '1.5px dashed var(--ns-blue)' : '0.5px solid var(--ns-border)',
                          WebkitTapHighlightColor: 'transparent',
                          opacity: savingWater ? 0.7 : 1,
                        }}
                      >
                        <svg width="14" height="18" viewBox="0 0 10 13" fill="none">
                          <path d="M5 1C5 1 1 6 1 9a4 4 0 008 0c0-3-4-8-4-8z"
                            fill={filled ? '#FFFFFF' : 'none'}
                            stroke={filled ? '#FFFFFF' : isNextToFill ? 'var(--ns-blue)' : 'var(--ns-text-disabled)'}
                            strokeWidth={filled ? '0' : '1.2'} />
                        </svg>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── ETAPA 7.2 — Nutri Score ─────────────────────────────────────── */}
        {!loading && (() => {
          const daysLogged = weekData.filter(v => v > 0).length;
          const avgCal = daysLogged > 0
            ? weekData.reduce((a, b) => a + b, 0) / daysLogged
            : 0;
          const calScore = avgCal > 0
            ? Math.max(0, 100 - Math.abs((avgCal - goalCal) / goalCal) * 100)
            : 0;
          const daysScore = (daysLogged / 7) * 40;
          const proteinScore = Math.min((todayData.protein / goals.protein) * 30, 30);
          const streakScore = Math.min(streakCount * 5, 30);
          const nutriScore = Math.round(daysScore * 0.4 + calScore * 0.3 + proteinScore * 0.2 + streakScore * 0.1);
          const scoreColor = nutriScore >= 75 ? 'var(--ns-accent)' : nutriScore >= 50 ? 'var(--ns-orange)' : 'var(--ns-danger)';
          const scoreLabel = nutriScore >= 75 ? 'Excelente semana!' : nutriScore >= 50 ? 'Boa semana' : 'Continue assim';
          const circ = 2 * Math.PI * 30;

          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em', marginBottom: 10 }}>
                Nutri Score semanal
              </div>
              <div style={{
                padding: '18px 20px', background: 'var(--ns-bg-card)',
                border: '0.5px solid var(--ns-border)', borderRadius: 16,
                boxShadow: 'var(--ns-shadow-sm)', display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="var(--ns-ring-track)" strokeWidth="6" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor} strokeWidth="6"
                      strokeDasharray={`${(nutriScore / 100) * circ} ${circ}`}
                      strokeLinecap="round" strokeDashoffset={circ * 0.25}
                      style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ns-text-primary)', lineHeight: 1, letterSpacing: '-0.04em' }}>{nutriScore}</div>
                    <div style={{ fontSize: 8, color: 'var(--ns-text-muted)', marginTop: 1 }}>/100</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor, marginBottom: 8 }}>{scoreLabel}</div>
                  {[
                    { label: 'Dias registrados', value: `${daysLogged}/7` },
                    { label: 'Streak', value: `${streakCount} dias` },
                    { label: 'Proteína hoje', value: `${Math.round((todayData.protein / goals.protein) * 100)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ns-text-muted)', marginBottom: 4 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--ns-text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ETAPA 7.1 — Recap Semanal ───────────────────────────────────── */}
        {!loading && weekData.filter(v => v > 0).length >= 3 && (() => {
          const daysLogged = weekData.filter(v => v > 0).length;
          const avgCal = Math.round(weekData.reduce((a, b) => a + b, 0) / daysLogged);
          const bestDay = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][weekData.indexOf(Math.max(...weekData))];
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em', marginBottom: 10 }}>
                Recap da semana
              </div>
              <div style={{
                background: 'linear-gradient(135deg, var(--ns-accent-bg) 0%, var(--ns-bg-card) 100%)',
                border: '0.5px solid rgba(45,143,94,0.25)', borderRadius: 16, padding: '16px 18px',
                boxShadow: 'var(--ns-shadow-sm)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { emoji: '📅', label: 'Dias ativos',    value: `${daysLogged} de 7` },
                    { emoji: '🔥', label: 'Média kcal/dia', value: avgCal.toLocaleString('pt-BR') },
                    { emoji: '⚡', label: 'Melhor dia',     value: bestDay },
                    { emoji: '💪', label: 'Streak atual',   value: `${streakCount} dias` },
                  ].map(({ emoji, label, value }) => (
                    <div key={label} style={{ background: 'var(--ns-bg-card)', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                      <div style={{ fontSize: 11, color: 'var(--ns-text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ETAPA 7.3 — Desafios Semanais ───────────────────────────────── */}
        {!loading && <WeeklyChallenges />}

      </div>
    </div>
  );
}

// ── Weekly Challenges (7.3) ─────────────────────────────────────────────────

const CHALLENGES_POOL = [
  { id: 'agua',     emoji: '💧', title: '8 copos de água',      desc: 'Complete a meta de hidratação hoje' },
  { id: 'streak',   emoji: '🔥', title: '5 dias consecutivos',  desc: 'Registre refeições por 5 dias seguidos' },
  { id: 'proteina', emoji: '💪', title: 'Meta de proteína',     desc: 'Atinja 100% da proteína hoje' },
  { id: 'scan3',    emoji: '📷', title: '3 scans no dia',       desc: 'Escaneie café, almoço e jantar' },
  { id: 'novo',     emoji: '🌱', title: 'Alimento novo',        desc: 'Experimente algo que nunca escaneou' },
];

function WeeklyChallenges() {
  const weekNum = Math.ceil(new Date().getDate() / 7);
  const challenges = [0, 1, 2].map(i => CHALLENGES_POOL[(weekNum + i) % CHALLENGES_POOL.length]);
  const storageKey = `ns_challenges_${new Date().toLocaleDateString('fr-CA').slice(0, 7)}`;
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  });

  function toggle(id) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }

  const completedCount = challenges.filter(c => done[c.id]).length;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ns-text-primary)', letterSpacing: '-0.02em' }}>
          Desafios da semana
        </div>
        <div style={{ fontSize: 12, color: 'var(--ns-text-muted)' }}>{completedCount}/{challenges.length}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {challenges.map(({ id, emoji, title, desc }) => {
          const isDone = !!done[id];
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                background: isDone ? 'var(--ns-accent-bg)' : 'var(--ns-bg-card)',
                border: isDone ? '0.5px solid rgba(45,143,94,0.3)' : '0.5px solid var(--ns-border)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                boxShadow: 'var(--ns-shadow-sm)', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: 'var(--ns-text-primary)',
                  letterSpacing: '-0.01em',
                  textDecoration: isDone ? 'line-through' : 'none',
                  opacity: isDone ? 0.5 : 1,
                }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--ns-text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: isDone ? 'var(--ns-accent)' : 'var(--ns-bg-elevated)',
                border: isDone ? 'none' : '1.5px solid var(--ns-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                {isDone && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

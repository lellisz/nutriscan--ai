import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { StatusBar } from '../../../app/AppShell';
import * as db from '../../../lib/db';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const DAY_ABBR = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatXLabel(dateStr, period) {
  const d = new Date(dateStr + 'T12:00:00');
  if (period === 7) return DAY_ABBR[d.getDay()];
  return `${d.getDate()}/${MONTH_ABBR[d.getMonth()]}`;
}

function SummaryCard({ value, label, sub, subColor }) {
  return (
    <div style={{
      background: 'var(--ns-bg-card)',
      border: '0.5px solid var(--ns-border)',
      borderRadius: 12,
      padding: '14px 12px',
      flex: 1,
      minWidth: 0,
      boxShadow: 'var(--ns-shadow-sm)',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ns-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ns-text-muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, fontWeight: 600, color: subColor ?? 'var(--ns-text-muted)', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SkeletonBlock({ height = 16, radius = 8, style = {} }) {
  return (
    <div style={{
      height, borderRadius: radius,
      background: 'var(--ns-bg-elevated)',
      animation: 'ns-pulse 1.4s ease infinite',
      ...style,
    }} />
  );
}

const CustomTooltip = ({ active, payload, label, caloriesGoal }) => {
  if (!active || !payload?.length) return null;
  const cal = payload[0]?.value ?? 0;
  const diff = cal - caloriesGoal;
  const diffStr = diff > 0 ? `+${diff} kcal da meta` : diff < 0 ? `${diff} kcal da meta` : 'Na meta';
  return (
    <div style={{
      background: 'var(--ns-bg-card)',
      border: '0.5px solid var(--ns-border)',
      borderRadius: 8, padding: '8px 12px',
      boxShadow: '0 4px 16px rgba(27,58,45,0.10)',
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--ns-text-primary)' }}>{label}</div>
      <div style={{ color: 'var(--ns-accent)', fontWeight: 700 }}>{cal.toLocaleString('pt-BR')} kcal</div>
      <div style={{ color: diff >= 0 ? 'var(--ns-accent)' : 'var(--ns-orange)', fontSize: 11 }}>{diffStr}</div>
    </div>
  );
};

export default function TrendsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(7);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [caloriesGoal, setCaloriesGoal] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id, period]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const goals = await db.getDailyGoals(user.id).catch(() => null);
      const goal = goals?.calories ?? 2000;
      setCaloriesGoal(goal);

      const [data, sum] = await Promise.all([
        db.getDailyMacros(user.id, period),
        db.getPeriodSummary(user.id, period, goal),
      ]);

      setDailyData(data.map(d => ({ ...d, label: formatXLabel(d.date, period) })));
      setSummary(sum);
    } catch (err) {
      console.error('[TrendsPage] Erro ao carregar tendências:', err);
      setError('Não foi possível carregar as tendências.');
    } finally {
      setLoading(false);
    }
  }

  const hasEnoughData = dailyData.filter(d => d.calories > 0).length >= 2;

  return (
    <div style={{ minHeight: '100dvh', background: 'transparent', paddingBottom: 100 }}>
      <StatusBar />

      {/* Header */}
      <header style={{ padding: '20px 20px 16px' }} className="animate-fade-up">
        <h1 style={{
          fontSize: 24, fontWeight: 700,
          color: 'var(--ns-text-primary)',
          letterSpacing: '-0.03em', margin: 0,
        }}>
          Tendências
        </h1>

        {/* Seletor 7d / 30d */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {[7, 30].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: period === p ? 'none' : '0.5px solid var(--ns-border)',
                background: period === p ? 'var(--ns-accent)' : 'var(--ns-bg-card)',
                color: period === p ? '#fff' : 'var(--ns-text-muted)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: period === p ? '0 2px 8px rgba(45,143,94,0.25)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {p === 7 ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: '0 20px' }}>

        {/* Banner de erro */}
        {error && (
          <div style={{
            padding: '12px 14px',
            background: 'var(--ns-orange-bg)',
            border: '0.5px solid rgba(217,119,6,0.20)',
            borderRadius: 12,
            color: 'var(--ns-orange)',
            fontSize: 13, marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button
              onClick={loadData}
              style={{ background: 'none', border: 'none', color: 'var(--ns-accent)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Cards de resumo — skeleton ou dados */}
        {loading ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <SkeletonBlock key={i} height={72} radius={12} style={{ flex: 1 }} />
            ))}
          </div>
        ) : summary && hasEnoughData ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }} className="animate-fade-up stagger-1">
            <SummaryCard
              value={`${summary.avgCalories.toLocaleString('pt-BR')}`}
              label="Média diária (kcal)"
              sub={`${summary.avgCalories > caloriesGoal ? '+' : ''}${summary.avgCalories - caloriesGoal} da meta`}
              subColor={summary.avgCalories >= caloriesGoal * 0.9 ? 'var(--ns-accent)' : 'var(--ns-orange)'}
            />
            <SummaryCard
              value={`${summary.daysOnGoal}/${summary.totalDays}`}
              label="Dias na meta"
            />
            <SummaryCard
              value={`${summary.avgProtein}g`}
              label="Média proteína"
            />
            <SummaryCard
              value={summary.bestDay ? summary.bestDay.date.slice(5).replace('-', '/') : '--'}
              label="Melhor dia"
              sub={summary.bestDay ? `${summary.bestDay.calories.toLocaleString('pt-BR')} kcal` : ''}
            />
          </div>
        ) : null}

        {/* Estado vazio — dados insuficientes */}
        {!loading && !hasEnoughData && (
          <div style={{
            background: 'var(--ns-bg-card)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 16, padding: '32px 20px',
            textAlign: 'center', marginBottom: 12,
          }} className="animate-fade-up stagger-2">
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ display: 'block', margin: '0 auto 8px' }}>
                <polyline points="4,30 12,20 20,24 28,14 36,18" stroke="var(--ns-border-strong)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ns-text-primary)', marginBottom: 6 }}>
              Sem dados suficientes
            </div>
            <div style={{ fontSize: 13, color: 'var(--ns-text-muted)', lineHeight: 1.5 }}>
              Registre pelo menos 2 dias para ver as tendências
            </div>
          </div>
        )}

        {/* Gráfico de calorias */}
        {(loading || hasEnoughData) && (
          <div style={{
            background: 'var(--ns-bg-card)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 16, padding: '16px 12px',
            marginBottom: 12,
            boxShadow: '0 2px 12px rgba(27,58,45,0.06)',
          }} className="animate-fade-up stagger-2">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ns-text-muted)', marginBottom: 12, paddingLeft: 4 }}>
              Calorias por dia
            </div>
            {loading ? (
              <SkeletonBlock height={200} radius={8} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--ns-text-muted)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--ns-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v === 0 ? '' : `${v}`}
                  />
                  <Tooltip content={<CustomTooltip caloriesGoal={caloriesGoal} />} />
                  <ReferenceLine
                    y={caloriesGoal}
                    stroke="var(--ns-accent)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="var(--ns-accent)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--ns-accent)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Gráfico de proteína */}
        {(loading || hasEnoughData) && (
          <div style={{
            background: 'var(--ns-bg-card)',
            border: '0.5px solid var(--ns-border)',
            borderRadius: 16, padding: '16px 12px',
            marginBottom: 12,
            boxShadow: '0 2px 12px rgba(27,58,45,0.06)',
          }} className="animate-fade-up stagger-3">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ns-text-muted)', marginBottom: 12, paddingLeft: 4 }}>
              Proteína por dia (g)
            </div>
            {loading ? (
              <SkeletonBlock height={160} radius={8} />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--ns-text-muted)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--ns-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v === 0 ? '' : `${v}`}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}g`, 'Proteína']}
                    contentStyle={{
                      background: 'var(--ns-bg-card)',
                      border: '0.5px solid var(--ns-border)',
                      borderRadius: 8, fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="protein"
                    stroke="var(--ns-blue)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--ns-blue)', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
